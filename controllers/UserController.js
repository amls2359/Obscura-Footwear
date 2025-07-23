const UserCollection = require('../models/user');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose') 
require("dotenv").config();
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');
const Wallet = require('../models/wallet')
const bcrypt= require('bcrypt')



const googleUser = async (req, res) => {
    try {
        console.log('Google user:', req.user);

        // Save user ID in session
        req.session.userid = req.user._id;
        req.session.isAuthenticated = true; 
        console.log(`Session set: ${req.session.userid}`);

        // Redirect to Homepage
        res.redirect('/Homepage');
    } catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({ error: 'Failed to log in with Google' });
    }
};


//! Render Pages
const userlogin = (req, res) =>{
    try
    {
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
    catch(error)
    {
        console.error(error)
    }
}
  
const userSignup = (req, res) => res.render('UserSignup', {
    errorMessage: null,
    successMessage: null
  });
const guesthomepage = (req, res) => res.render('guesthomepage')
const forgetPassword = (req, res) => res.render('forgetPassword');
const otp = (req, res) => res.render('otp');
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
let referred ='false' // Temporary storage for OTPs

//! Generate a 6-digit OTP
const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};



//! Send OTP Email Function
const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_ADDRESS, 
                pass: process.env.EMAIL_PASSWORD,
            },
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

    // Initialize all template variables with default values
    const templateData = {
        email: email || '',
        emailError: null,
        passwordError: null,
        errorMessage: null,
        successMessage: null
    };

    // Basic validation
    if (!email || !password) {
        return res.render('UserLogin', {
            ...templateData,
            emailError: !email ? 'Email is required' : null,
            passwordError: !password ? 'Password is required' : null
        });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.render('UserLogin', {
            ...templateData,
            email,
            emailError: 'Please enter a valid email address'
        });
    }

    try {
        const user = await UserCollection.findOne({ email });

        if (!user) {
            return res.render('UserLogin', {
                ...templateData,
                email,
                emailError: 'No account found with this email'
            });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.render('UserLogin', {
                ...templateData,
                email,
                passwordError: 'Incorrect password'
            });
        }

        req.session.userid = user._id;
        req.session.email = user.email;
        req.session.isAuthenticated = true;
        req.session.username = user.username || '';
        req.session.role = user.role || 'user';

        req.session.save(err => {
            if (err) {
                console.error("Session save error:", err);
                return res.render('UserLogin', {
                    ...templateData,
                    email,
                    errorMessage: 'An error occurred during login. Please try again.'
                });
            }

            const returnTo = req.session.returnTo || '/Homepage';
            delete req.session.returnTo;
            return res.redirect(returnTo);
        });

    } catch (err) {
        console.error("Login error:", err);
        return res.render('UserLogin', {
            ...templateData,
            email,
            errorMessage: 'An internal server error occurred. Please try again later.'
        });
    }
};



const generatereferralcode=(lenght)=>
{
    const characters="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    let referralCode=''

    for(let i=0;i<lenght;i++)
    {
        const randomIndex= Math.floor(Math.random()*characters.length)
        referralCode += characters[randomIndex]
    }
    return referralCode
}


  
//! User Signup Handler
const userSignupPost = async (req, res) => {

    console.log('Enteres in to signup post');
    
    const { email, password, username } = req.body;

    console.log(`body email is${email}`);
    console.log(`body password is${password}`);
    console.log(`body username  is${username }`);
    
    try {
        // Check if user already exists with the same email or username
        const existingUser = await UserCollection.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            console.log('rendering existing user');
            
            return res.render('UserSignup', { 
                errorMessage: 'User already exists with this email or username', 
                successMessage: null 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('hashed password is ',hashedPassword);
        

        const referralcode=generatereferralcode(8)
        console.log('Referalcode is:',referralcode);

        if(req.body.referralcode)
        {
            referral=req.body.referalcode
            referredUser= await UserCollection.findOne({referralcode:referral})
            console.log('referrred user:', referredUser);
            console.log('referral:', referral);
            
            if( referredUser)
            {
                referred="true"
            }
            else
            {
                return res.status(400).json({success:false,message:"Referral code not found"})
            }
        }
        
        const newUser = new UserCollection({
            email,
            username,
            password: hashedPassword  ,
            phone:req.body.number,
            referralcode:referralcode,
            wallet : referredUser ? 50:0 
        });

        // Save the user to the database
        await newUser.save();
        console.log(`${newUser}`);
        

        // Set session variables
        req.session.userid = newUser._id;
        req.session.email = newUser.email;
        req.session.isAuthenticated = true;

        // Redirect to the login page with a success message
        req.session.successMessage = 'You are registered successfully! You can now log in.';
        res.redirect('/UserLogin');

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).render('UserSignup', { 
            errorMessage: 'Internal Server Error', 
            successMessage: null 
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
        otpStorage[email] = {
            otp,
            timestamp: Date.now()
        };

        // Send OTP via email
        await sendOtpEmail(email, otp);

        // ✅ Pass `userEmail` and `showResendButton` when rendering `otp.ejs`
        return res.render('otp', { 
            successMessage: 'OTP has been sent to your email. Please check your inbox.', 
            errorMessage: null, 
            userEmail: email,
            showResendButton: false ,// Default value
            isInitialLoad: true
        });

    } catch (error) {
        console.error("Error in forgetPasswordPost:", error);
        return res.render('forgetPassword', { errorMessage: 'Something went wrong. Please try again.', successMessage: null });
    }
};


//! OTP Verification Handler
const otpVerifyPost = async (req, res) => {
    const { email, otp1, otp2, otp3, otp4, otp5, otp6 ,timeLeft} = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

    let remainingTime = parseInt(timeLeft)||60

    if (!email || !otp1 || !otp2 || !otp3 || !otp4 || !otp5 || !otp6) {
        return res.render('otp', {
            errorMessage: 'please fill all otp field and email',
            successMessage: null,
            userEmail: email || null,
            showResendButton: true,
            timeLeft:remainingTime,
            isInitialLoad: false
        });
    }

    try {
        const storedOtpData = otpStorage[email];
        
        if (!storedOtpData) {
            return res.render('otp', {
                errorMessage: 'No OTP found for this email. Please request a new OTP.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                timeLeft:remainingTime,
                isInitialLoad: false
            });
        }

        // 5 minutes expiration (300000 ms)
        const isExpired = (Date.now() - storedOtpData.timestamp) > 300000;
        
        if (isExpired) {
            delete otpStorage[email];
            return res.render('otp', {
                errorMessage: 'OTP has expired. Please request a new OTP.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                 timeLeft:remainingTime,
                isInitialLoad: false
            });
        }

        if (otp !== storedOtpData.otp) {
            return res.render('otp', {
                errorMessage: 'Invalid OTP. Please try again.',
                successMessage: null,
                userEmail: email,
                showResendButton: true,
                 timeLeft:remainingTime,
                isInitialLoad: false
            });
        }

        // OTP is valid - proceed to password reset page
        delete otpStorage[email];
        return res.render('resetPassword', {
            email: email,
            errorMessage: null,
            successMessage: null
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.render('otp', {
            errorMessage: 'Something went wrong. Please try again.',
            successMessage: null,
            userEmail: email,
            showResendButton: true,
            // timeLeft:remainingTime,
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
        
        return res.render('resetPassword', { 
            success: false, 
            errorMessage: 'Please fill in all fields.',
            email,
            redirect:false
        });
    }

    if (newPassword !== confirmPassword) {
        console.log('entered into comparing password');
        
        return res.render('resetPassword', { 
            success: false, 
            errorMessage: 'Passwords do not match.',
            email,
            redirect:false
        });
    }

 const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{7,}$/;

if (!strongPasswordRegex.test(newPassword)) {
    return res.render('resetPassword', {
        success: false,
        errorMessage: 'Password must be at least 7 characters long and include uppercase letters, numbers, and special characters.',
        email,
        redirect:false
    });
}


    try {
        const user = await UserCollection.findOne({ email });

        if (!user) {
            return res.render('resetPassword', { 
                success: false, 
                errorMessage: 'User not found.',
                email,
                redirect:false
            });
        }

        // Update the user's password
        console.log(`new password is ${newPassword}`);
        
        const hashedPassword = await bcrypt.hash(newPassword,10)
        console.log(`hashed password is ${hashedPassword}`);
        
        user.password =  hashedPassword; // Hash this password in a real app!
        await user.save();

        return res.render('resetPassword', { 
            success: true, 
            message: 'Password reset successful! Redirecting to login...',
            errorMessage:'',
            email,
            redirect: true // This flag helps in JavaScript redirection
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        return res.render('resetPassword', { 
            success: false, 
            errorMessage: 'Something went wrong. Please try again.',
            email,
            redirect:false
        });
    }
};


const   resendOtpPost = async (req, res) => {
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

        // Generate new OTP
        const otp = generateRandomOtp();
        otpStorage[email] = {
            otp,
            timestamp: Date.now()
        };

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

const logout = (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }

        // Clear the session cookie
        res.clearCookie('connect.sid'); // 'connect.sid' is the default name for the session cookie

        // Redirect to the login page or home page
        res.redirect('/UserLogin');
    });
};


const wishlist = async (req, res) => {
    try {
        const userid = req.session.userid;

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
                imagePath : imagePath ,
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
    const userid = req.session.userid;

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
        const userid = req.session.userid;

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
        const userId = req.session.userid;
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
    logout,
    wishlist,
    addToWishlist,
    removeWishlist,
    getWallet
};
