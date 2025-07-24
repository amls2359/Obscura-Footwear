const express= require('express')
const router= express.Router()
const {checkSessionBlocked} = require('../Middleware/user')
const profileController = require('../controllers/userProfileController')


router.get('/userProfile',checkSessionBlocked ,profileController.userProfileget)
router.get('/editProfile',checkSessionBlocked,profileController.editProfileGet)
router.post('/updateProfile',checkSessionBlocked,profileController.editProfilePost)
router.get('/changepassword',checkSessionBlocked,profileController.changePasswordGet)
router.post('/updatedPassword',checkSessionBlocked,profileController.changePasswordPost)
router.get('/userAddress',checkSessionBlocked,profileController.showUserAddress)
router.get('/addAddress',checkSessionBlocked,profileController.addAddress)
router.post('/addAddressPost',checkSessionBlocked,profileController.addAddressPost)
router.get('/editAddress/:id',checkSessionBlocked,profileController.editAddressGet)
router.post('/editAddressPost/:id',checkSessionBlocked,profileController.editAddresspost)
router.get('/deleteAddress/:id',checkSessionBlocked,profileController.deleteAddress)

module.exports=router