const express= require('express')
const router= express.Router()
const {checkSessionBlocked} = require('../Middleware/user')
const profileController = require('../controllers/userProfileController')
const {jwtAuth} = require('../Middleware/jwtAuth')
const {isUser} = require('../Middleware/roleMiddleware')


router.get('/userProfile', jwtAuth, isUser, profileController.userProfileget)
router.get('/editProfile', jwtAuth, isUser, profileController.editProfileGet)
router.post('/updateProfile', jwtAuth, isUser, profileController.editProfilePost)
router.get('/changepassword', jwtAuth, isUser, profileController.changePasswordGet)
router.post('/updatedPassword', jwtAuth, isUser, profileController.changePasswordPost)
router.get('/userAddress', jwtAuth, isUser, profileController.showUserAddress)
router.get('/addAddress', jwtAuth, isUser, profileController.addAddress)
router.post('/addAddressPost', jwtAuth, isUser, profileController.addAddressPost)
router.get('/editAddress/:id',checkSessionBlocked,profileController.editAddressGet)
router.post('/editAddressPost/:id', jwtAuth, isUser, profileController.editAddresspost)
router.get('/deleteAddress/:id', jwtAuth, isUser, profileController.deleteAddress)

module.exports=router