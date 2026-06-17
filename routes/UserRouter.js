const express=require('express')
const router=express.Router()
const UserController=require('../controllers/UserController')
const passport = require('passport');
const {jwtAuth} = require('../Middleware/jwtAuth')
const {isUser} = require('../Middleware/roleMiddleware')




router.get('/UserLogin',UserController.userlogin)
router.post('/userLoginPost',UserController.userLoginPost)
router.post('/googleauthSession',UserController.googleauthSession)
router.post('/userSignupPost',UserController.userSignupPost)
router.get('/UserSignup',UserController.userSignup)

router.get('/forgetPassword',UserController.forgetPassword)
router.post('/forgetPasswordPost',UserController.forgetPasswordPost)

// In your route handler for rendering the reset password page
router.get('/resetPassword',UserController.resetPassword);
router.post('/resetPasswordPost',UserController.resetPasswordPost)

router.get('/otp',UserController.otp)
router.post('/sendOtpEmail',UserController.sendOtpEmail)

router.post('/resendOtpPost',UserController.resendOtpPost)

router.post('/otpVerifyPost',UserController.otpVerifyPost)

router.get('/guesthomepage',UserController.guesthomepage)
router.get('/Homepage',jwtAuth,isUser,UserController.Homepage)

router.post('/addwishlist/:id',jwtAuth,isUser,UserController.addToWishlist)
router.get('/Wishlist',jwtAuth,isUser,UserController.wishlist)

router.post('/removefromWishlist/:id',jwtAuth,isUser,UserController.removeWishlist)
router.get('/wallet',jwtAuth,isUser,UserController.getWallet)


// Route to trigger Google Sign-In
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback after Google login
router.get('/auth/google/callback',
  passport.authenticate('google', 
    { 
      failureRedirect: '/guesthomepage',
      session: false
     }),
  UserController.googleUser
);


module.exports=router;