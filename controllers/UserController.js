const UserCollection = require('../models/user');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose')
require("dotenv").config();
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');
const Wallet = require('../models/wallet')
const bcrypt = require('bcrypt')
const otpModel = require('../models/otpModel')
const { generateTokens, verifyAccessToken, verifyRefreshToken } = require('../config/jwtConfig');
const {
    successResponse,
    errorResponse,
    wantsJsonResponse,
} = require('../utils/reposnseHandler');

const jwt = require('jsonwebtoken');


const googleUser = async (req, res) => {
    try {
        console.log('✅ Reached googleUser controller');

        if (!req.user) {
            return res.redirect('/guesthomepage');
        }

        console.log('👤 Google user:', req.user);

        // Generate Access Token (short life)
        const accessToken = jwt.sign(
            {
                userId: req.user._id,
                email: req.user.email,
                role: req.user.role || 'user'
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        // Generate Refresh Token (long life)
        const refreshToken = jwt.sign(
            {
                userId: req.user._id,
                email: req.user.email
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // ✅ Access Token Cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });

        // ✅ Refresh Token Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        // 👉 Redirect instead of passing token to frontend
        return res.redirect('/Homepage');

    } catch (error) {
        console.error('❌ Google login error:', error);
        return res.status(500).json({ error: 'Failed to log in with Google' });
    }
};


//! Render Pages
const userlogin = (req, res) => {
    try {
        const message = req.query.message;
        let errorMessage = null;

        if (message === 'account_blocked') {
            errorMessage = 'Your account is blocked';
        }

        res.render('UserLogin', {
            email: '',
            emailError: null,
            passwordError: null,
            errorMessage,
            successMessage: null
        });
    }
    catch (error) {
        console.error(error)
    }
}

const userSignup = (req, res) => res.render('UserSignup', {
    errorMessage: null,
    successMessage: null
});
const guesthomepage = (req, res) => res.render('guesthomepage')
const forgetPassword = (req, res) => res.render('forgetPassword');

const otp = (req, res) => {
    const remainingTime = 60; //  Set default value
    res.render('otp', {
        timeLeft: remainingTime,
        errorMessage: null,
        successMessage: null,
        userEmail: req.query.email || null,
        showResendButton: false,
        isInitialLoad: true
    });
};

const resetPassword = (req, res) => res.render('ResetPassword');



const Homepage = async (req, res) => {
    try {
        // Step 1: Fetch only listed products with stock >= 1
        const rawProducts = await Product.find({
            isListed: true,
            stock: { $gte: 1 }
        })
            .populate({
                path: 'category',
                match: { islisted: true },
                select: 'name'
            })
            .limit(15);

        const filteredProducts = rawProducts.filter(p => p.category !== null);

        // Step 3: Select only the first 4 valid products
        const productCollection = filteredProducts.slice(0, 4);

        // Step 3: Render homepage with only products with valid categories
        res.render('Homepage', { productCollection });
    } catch (error) {
        console.error('Error rendering homepage:', error);
        res.status(500).send('Internal Server Error');
    }
};


let otpStorage = {};
let referral;
let referredUser;
let referred = 'false' // Temporary storage for OTPs

//! Generate a 6-digit OTP
const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};



//! Send OTP Email Function
const sendOtpEmail = async (email, otp) => {
    try {
        console.log("email address is", process.env.EMAIL_ADDRESS);
        console.log("email password is", process.env.EMAIL_PASSWORD);
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}. It expires in 1 minute.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP sent to:", email);
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};



//! User Login Handler
const userLoginPost = async (req, res) => {
    const { email, password } = req.body;
        console.log("LOGIN CONTROLLER HIT");

    const wantsJson = wantsJsonResponse(req);

    const templateData = {
        email: email || '',
        emailError: null,
        passwordError: null,
        errorMessage: null,
        successMessage: null
    };

    // Validate required fields
    if (!email || !password) {
        const errorResponse = {
            emailError: !email ? 'Email is required' : null,
            passwordError: !password ? 'Password is required' : null
        };

        if (wantsJson) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorResponse
            });
        }

        return res.render('UserLogin', {
            ...templateData,
            ...errorResponse
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        if (wantsJson) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        return res.render('UserLogin', {
            ...templateData,
            email,
            emailError: 'Please enter a valid email address'
        });
    }

    try {

        // Find user
        const user = await UserCollection.findOne({ email });

        if (!user) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'No account found with this email'
                });
            }

            return res.render('UserLogin', {
                ...templateData,
                email,
                emailError: 'No account found with this email'
            });
        }

        // Google account check
        if (!user.password) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'This account was registered using Google. Please login with Google.'
                });
            }

            return res.render('UserLogin', {
                ...templateData,
                email,
                passwordError: 'This account was registered using Google. Please login with Google.'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'Incorrect password'
                });
            }

            return res.render('UserLogin', {
                ...templateData,
                email,
                passwordError: 'Incorrect password'
            });
        }

        // Generate Access Token (15m)
        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role || 'user'
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: '15m'
            }
        );

        console.log('Generated Access Token:', accessToken);

        // Generate Refresh Token (7d)
        const refreshToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role || 'user'
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: '7d'
            }
        );

        console.log('Generated Refresh Token:', refreshToken);

        // Set Access Token Cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });

        // Set Refresh Token Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        console.log('Access Token set:', accessToken);
        console.log('Refresh Token set:', refreshToken);

        // API response
        if (wantsJson) {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role || 'user'
                }
            });
        }

        // EJS redirect
        return res.redirect('/Homepage');

    } catch (err) {
        console.error('Login error:', err);

        if (wantsJson) {
            return res.status(500).json({
                success: false,
                message: 'An internal server error occurred. Please try again later.'
            });
        }

        return res.render('UserLogin', {
            ...templateData,
            email,
            errorMessage: 'An internal server error occurred. Please try again later.'
        });
    }
};


// Test endpoint for generating session with Google user
const googleauthSession = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return errorResponse(res, 'Email is required', 400);
    }

    try {
        // Find the Google user
        const user = await UserCollection.findOne({ email });

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Check if it's a Google user (has googleId and no password)
        if (!user.googleId) {
            return errorResponse(res, 'This is not a Google account. Use regular login.', 400);
        }

        // Create session
        req.session.userid = user._id;
        req.session.email = user.email;
        req.session.isAuthenticated = true;
        req.session.username = user.username || '';
        req.session.role = user.role || 'user';
        req.session.authProvider = 'google';
        req.session.googleId = user.googleId;

        // Save session
        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return errorResponse(res, 'Failed to create session', 500);
            }

            return successResponse(res, 'Google user session created successfully', {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role || 'user',
                    authProvider: 'google',
                    isblocked: user.isblocked,
                    referralcode: user.referralcode
                },
                sessionId: req.session.id
            });
        });

    } catch (error) {
        console.error("Error creating Google session:", error);
        return errorResponse(res, 'Internal server error', 500);
    }
};


const generatereferralcode = (lenght) => {
    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    let referralCode = ''

    for (let i = 0; i < lenght; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        referralCode += characters[randomIndex]
    }
    return referralCode
}

const userSignupPost = async (req, res) => {
    const json = wantsJsonResponse(req);
    const { email, password, username } = req.body;

    try {
        const existingUser = await UserCollection.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (json) {
                return errorResponse(res, 'User already exists with this email or username', 409);
            }
            return res.render('UserSignup', {
                errorMessage: 'User already exists with this email or username',
                successMessage: null,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const referralcode = generatereferralcode(8);

        let referredUser = null;
        if (req.body.referralcode) {
            referredUser = await UserCollection.findOne({
                referralcode: req.body.referralcode,
            });

            if (!referredUser) {
                if (json) return errorResponse(res, 'Referral code not found', 400);
                return res.render('UserSignup', {
                    errorMessage: 'Referral code not found',
                    successMessage: null,
                });
            }
        }

        const newUser = new UserCollection({
            email,
            username,
            password: hashedPassword,
            phone: req.body.number,
            referralcode,
            wallet: referredUser ? 50 : 0,
        });

        await newUser.save();

        if (json) {
            return successResponse(
                res,
                'Registration successful',
                {
                    user: {
                        id: newUser._id,
                        email: newUser.email,
                        username: newUser.username,
                        referralcode: newUser.referralcode,
                        wallet: newUser.wallet,
                        role: 'user',
                    },
                },
                201
            );
        }

        // For web requests, redirect to login page after successful signup
        return res.render('UserSignup', {
            errorMessage: null,
            successMessage: 'Registration successful! Please login to continue.',
        });

    } catch (err) {
        console.error('Signup error:', err);
        if (json) return errorResponse(res, 'Internal Server Error', 500);
        return res.status(500).render('UserSignup', {
            errorMessage: 'Internal Server Error',
            successMessage: null,
        });
    }
};


//! Forget Password Handler
const forgetPasswordPost = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.render('forgetPassword', { errorMessage: 'Please enter an email.', successMessage: null });
        }

        const user = await UserCollection.findOne({ email });
        if (!user) {
            return res.render('forgetPassword', { errorMessage: 'User not found. Please check your email.', successMessage: null });
        }

        // Generate and store OTP with timestamp
        const otp = generateRandomOtp();
        await otpModel.findOneAndUpdate(
            { email },
            { otp, timestamp: Date.now() },
            { upsert: true, new: true }
        )

        // Send OTP via email
        await sendOtpEmail(email, otp);

        // ✅ Pass `userEmail` and `showResendButton` when rendering `otp.ejs`
        return res.render('otp', {
            successMessage: 'OTP has been sent to your email. Please check your inbox.',
            errorMessage: null,
            userEmail: email,
            showResendButton: false,// Default value
            isInitialLoad: true,
            timeLeft: 60
        });

    } catch (error) {
        console.error("Error in forgetPasswordPost:", error);
        return res.render('forgetPassword', { errorMessage: 'Something went wrong. Please try again.', successMessage: null });
    }
};


//! OTP Verification Handler
const otpVerifyPost = async (req, res) => {
    const { email, otp1, otp2, otp3, otp4, otp5, otp6, timeLeft } = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

    let remainingTime = parseInt(timeLeft);
    if (isNaN(remainingTime) || remainingTime <= 0 || remainingTime > 300) remainingTime = 60;


    if (!email || !otp1 || !otp2 || !otp3 || !otp4 || !otp5 || !otp6) {
        return res.render('otp', {
            errorMessage: 'please fill all otp field and email',
            successMessage: null,
            userEmail: email || null,
            showResendButton: true,
            timeLeft: remainingTime,
            isInitialLoad: false
        });
    }

    try {
        const storedOtpData = await otpModel.findOne({ email });

        if (!storedOtpData) {
            return res.render('otp', {
                errorMessage: 'No OTP found for this email. Please request a new OTP.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                timeLeft: remainingTime,
                isInitialLoad: false
            });
        }

        // 5 minutes expiration (300000 ms)
        const isExpired = (Date.now() - storedOtpData.timestamp) > 300000;

        if (isExpired) {
            await otpModel.deleteOne({ email });;
            return res.render('otp', {
                errorMessage: 'OTP has expired. Please request a new OTP.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                timeLeft: remainingTime,
                isInitialLoad: false
            });
        }

        if (otp !== storedOtpData.otp) {
            return res.render('otp', {
                errorMessage: 'Invalid OTP. Please try again.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                timeLeft: remainingTime,
                isInitialLoad: false
            });
        }

        // OTP is valid - proceed to password reset page
        await otpModel.deleteOne({ email });

        return res.render('ResetPassword', {
            email: email,
            errorMessage: null,
            successMessage: null,
            timeLeft: remainingTime,

        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.render('otp', {
            errorMessage: 'Something went wrong. Please try again.',
            successMessage: null,
            userEmail: email,
            showResendButton: true,
            timeLeft: remainingTime,
            isInitialLoad: false
        });
    }
};


//! Reset Password Handler
const resetPasswordPost = async (req, res) => {
    console.log('entered into reset password post');

    const { newPassword, confirmPassword, email } = req.body;

    console.log(`new password:${newPassword},
        confirm password:${confirmPassword},
        email:${email} `);


    if (!newPassword || !confirmPassword || !email) {
        console.log('entered into empty validation');

        return res.render('ResetPassword', {
            success: false,
            errorMessage: 'Please fill in all fields.',
            email,
            redirect: false
        });
    }

    if (newPassword !== confirmPassword) {
        console.log('entered into comparing password');

        return res.render('ResetPassword', {
            success: false,
            errorMessage: 'Passwords do not match.',
            email,
            redirect: false
        });
    }

    const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{7,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
        return res.render('ResetPassword', {
            success: false,
            errorMessage: 'Password must be at least 7 characters long and include uppercase letters, numbers, and special characters.',
            email,
            redirect: false
        });
    }


    try {
        const user = await UserCollection.findOne({ email });

        if (!user) {
            return res.render('ResetPassword', {
                success: false,
                errorMessage: 'User not found.',
                email,
                redirect: false
            });
        }

        // Update the user's password
        console.log(`new password is ${newPassword}`);

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        console.log(`hashed password is ${hashedPassword}`);

        user.password = hashedPassword; // Hash this password in a real app!
        await user.save();

        return res.render('ResetPassword', {
            success: true,
            message: 'Password reset successful! Redirecting to login...',
            errorMessage: '',
            email,
            redirect: true // This flag helps in JavaScript redirection
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        return res.render('ResetPassword', {
            success: false,
            errorMessage: 'Something went wrong. Please try again.',
            email,
            redirect: false
        });
    }
};


const resendOtpPost = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.render('otp', {
                errorMessage: 'Email is required to resend OTP.',
                successMessage: null,
                userEmail: null,
                showResendButton: true,
                isInitialLoad: false
            });
        }

        const user = await UserCollection.findOne({ email });
        if (!user) {
            return res.render('otp', {
                errorMessage: 'User not found. Please check your email.',
                successMessage: null,
                userEmail: null,
                showResendButton: true,
                isInitialLoad: false
            });
        }

        const otp = generateRandomOtp();

        // Generate new OTP
        await otpModel.findOneAndUpdate(
            { email },
            { otp, timestamp: Date.now() },
            { upsert: true, new: true }
        );


        // Send new OTP via email
        await sendOtpEmail(email, otp);

        return res.render('otp', {
            successMessage: 'New OTP has been sent to your email. Please check your inbox.',
            errorMessage: null,
            userEmail: email,
            showResendButton: true,
            isInitialLoad: false
        });

    } catch (error) {
        console.error("Error in resendOTPPost:", error);
        return res.render('otp', {
            errorMessage: 'Something went wrong. Please try again.',
            successMessage: null,
            userEmail: req.body.email || null,
            showResendButton: true,
            isInitialLoad: false
        });
    }
};




const wishlist = async (req, res) => {
    try {
        const userid = req.user.userId;

        // Fetch wishlist items and populate productid
        const wishlistItems = await Wishlist.find({ userid })
            .populate({
                path: 'productid',
                populate: {
                    path: 'category',   // 👈 this will populate the category field inside productid
                    model: 'Category'
                }
            })
            .lean();
        // Check if wishlist is empty
        const isEmpty = wishlistItems.length === 0;

        // Format wishlist data for rendering
        const wishlist = wishlistItems.map(item => {
            const product = item.productid && item.productid._id ? item.productid : item;

            // Handle image path safely
            let imagePath = product.image // fallback image

            return {
                _id: item._id, // Wishlist item ID (used for remove)
                productid: product._id, // Actual product ID (used for view)
                product: product.productname || 'Unnamed Product',
                price: product.price || 0,
                imagePath: imagePath,
                category: product.category?.name || 'Uncategorized'
            };
        });

        console.log("Final Wishlist Data:");
        console.log(wishlist)

        res.render('wishlist', {
            wishlist,
            isEmpty,
        });
    } catch (error) {
        console.error('Error loading wishlist:', error);
        res.redirect('/allproducts');
    }
};



const addToWishlist = async (req, res) => {
    try {
        const productid = req.params.id;
        const userid = req.user.userId;

        if (!userid) {
            return res.status(401).json({ success: false, message: 'Please login to add items to wishlist' });
        }

        const product = await Product.findById(productid);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const existingItem = await Wishlist.findOne({ userid, productid });
        if (existingItem) {
            return res.status(200).json({ success: false, message: 'Already in wishlist' });
        }

        await Wishlist.create({
            userid,
            productid,
            product: product.productname,
            price: product.price,
            image: product.image[0],
        });

        return res.status(200).json({ success: true, message: 'Product added to wishlist' });

    } catch (error) {
        console.error('Add to Wishlist Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
    }
};



const removeWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const userid = req.user.userId;

        if (!userid) {
            return res.status(401).json({ success: false, message: 'Please login to remove items from wishlist' });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid wishlist item ID' });
        }

        const item = await Wishlist.findOneAndDelete({
            productid: productId,
            userid: userid
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in your wishlist' });
        }

        return res.status(200).json({ success: true, message: 'Product removed from wishlist' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
    }
};



const getWallet = async (req, res) => {
    console.log('entered into wallet details');

    try {
        const userId = req.user.userId;
        const userData = await UserCollection.findById(userId);
        const Walletdetails = await Wallet.find({ userid: userId }).sort({ date: -1 });

        console.log(`userid is ${userId}`);
        console.log(`userdata is ${userData}`);
        console.log(`wallet details is ${Walletdetails}`);

        res.render('wallet', { userData, Walletdetails });
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        return res.status(500).json({ error: 'Failed to fetch wallet details' });
    }
};


module.exports =
{
    googleUser,
    userlogin,
    userSignup,
    userSignupPost,
    userLoginPost,
    googleauthSession,
    guesthomepage,
    forgetPassword,
    forgetPasswordPost,
    otp,
    otpVerifyPost,
    resetPassword,
    resetPasswordPost,
    sendOtpEmail,
    resendOtpPost,
    Homepage,
    wishlist,
    addToWishlist,
    removeWishlist,
    getWallet
};
