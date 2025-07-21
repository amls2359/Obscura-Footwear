const express= require('express')
const router= express.Router()
const {checkSessionBlocked} = require('../Middleware/user')
const profileController = require('../controllers/userProfileController')


router.get('/userProfile',checkSessionBlocked ,profileController.userProfileget)
router.get('/editProfile',profileController.editProfileGet)
router.post('/updateProfile',profileController.editProfilePost)
router.get('/changepassword',profileController.changePasswordGet)
router.post('/updatedPassword',profileController.changePasswordPost)
router.get('/userAddress',checkSessionBlocked,profileController.showUserAddress)
router.get('/addAddress',checkSessionBlocked,profileController.addAddress)
router.post('/addAddressPost',profileController.addAddressPost)
router.get('/editAddress/:id',profileController.editAddressGet)
router.post('/editAddressPost/:id',profileController.editAddresspost)
router.get('/deleteAddress/:id',profileController.deleteAddress)

module.exports=router