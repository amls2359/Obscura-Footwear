const express = require('express')
const router = express.Router()
const productOfferController = require('../controllers/couponController')
const{jwtAdminAuth}= require('../Middleware/jwtAuth')
const{isSuperAdmin} = require('../Middleware/roleMiddleware')


router.post('/coupencheck',jwtAdminAuth,isSuperAdmin,productOfferController.coupenCheck)
router.post('/deleteCoupon',jwtAdminAuth,isSuperAdmin,productOfferController.couponRemove)

router.get('/offermanagement',jwtAdminAuth,isSuperAdmin,productOfferController.productOfferGet)
router.get('/addProductOffer',jwtAdminAuth,isSuperAdmin,productOfferController.addProductOffer)
router.post('/addProductOfferPost',jwtAdminAuth,isSuperAdmin,productOfferController.addProductOfferPost)
router.get('/addCategoryOffer',jwtAdminAuth,isSuperAdmin,productOfferController.categoryOfferGet)
router.post('/addCategoryOfferPost',jwtAdminAuth,isSuperAdmin,productOfferController.AddCategoryPost)
router.get('/deleteProductOffer/:id',jwtAdminAuth,isSuperAdmin,productOfferController.deleteProductOffer)
router.get('/deleteCategoryOffer/:id',jwtAdminAuth,isSuperAdmin,productOfferController.deleteCategoryOffer)

//coupon rotes
router.get('/couponManagement',jwtAdminAuth,isSuperAdmin,productOfferController.couponManagementGet)
router.get('/addCouponget',jwtAdminAuth,isSuperAdmin,productOfferController.addCouponGet)
router.get('/allCoupens',jwtAdminAuth,isSuperAdmin,productOfferController.allCoupenget)
router.post('/addCouponPost',jwtAdminAuth,isSuperAdmin,productOfferController.addCouponPost)
router.get('/deleteCoupon/:id',jwtAdminAuth,isSuperAdmin,productOfferController.couponDelete)


module.exports=router