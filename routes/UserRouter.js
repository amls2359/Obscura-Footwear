const express=require('express')
const router=express.Router()
const UserController=require('../controllers/UserController')

const {checkSessionBlocked} = require("../Middleware/user");
const {logoutIfNeeded} = require('../Middleware/logout')
const passport = require('passport');




router.get('/UserLogin',UserController.userlogin)
router.post('/userLoginPost',UserController.userLoginPost)

router.post('/userSignupPost',UserController.userSignupPost)
router.get('/UserSignup',UserController.userSignup)

router.get('/forgetPassword',UserController.forgetPassword)
router.post('/forgetPasswordPost',UserController.forgetPasswordPost)

// In your route handler for rendering the reset password page
router.get('/resetPassword', (req, res) => {
    const email = req.query.email; // Assuming email is passed as a query parameter
    res.render('resetPassword', { email,  errorMessage: '' });
  });
router.post('/resetPasswordPost',UserController.resetPasswordPost)

router.get('/otp',UserController.otp)
router.post('/sendOtpEmail',UserController.sendOtpEmail)

router.post('/resendOtpPost',UserController.resendOtpPost)

router.post('/otpVerifyPost',UserController.otpVerifyPost)

router.get('/guesthomepage',UserController.guesthomepage)
router.get('/Homepage',logoutIfNeeded,checkSessionBlocked,UserController.Homepage)

router.get('/logout',UserController.logout)

router.post('/addwishlist/:id',checkSessionBlocked,UserController.addToWishlist)
router.get('/Wishlist',UserController.wishlist)

router.delete('/removefromWishlist/:id',checkSessionBlocked,UserController.removeWishlist)
router.get('/wallet',checkSessionBlocked,UserController.getWallet)


// Route to trigger Google Sign-In
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback after Google login
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/userLogin' }),
  UserController.googleUser
);


// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/UserLogin');
  });
});

module.exports=router;