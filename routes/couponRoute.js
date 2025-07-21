const express = require('express')
const router = express.Router()
const productOfferController = require('../controllers/couponController')
const {checkSession}= require('../Middleware/admin')


router.post('/coupencheck',productOfferController.coupenCheck)
router.post('/deleteCoupon',productOfferController.couponRemove)

router.get('/offermanagement',checkSession,productOfferController.productOfferGet)
router.get('/addProductOffer',checkSession,productOfferController.addProductOffer)
router.post('/addProductOfferPost',checkSession,productOfferController.addProductOfferPost)
router.get('/addCategoryOffer',checkSession,productOfferController.categoryOfferGet)
router.post('/addCategoryOfferPost',checkSession,productOfferController.AddCategoryPost)
router.get('/deleteProductOffer/:id',checkSession,productOfferController.deleteProductOffer)
router.get('/deleteCategoryOffer/:id',checkSession,productOfferController.deleteCategoryOffer)

//coupon rotes
router.get('/couponManagement',checkSession,productOfferController.couponManagementGet)
router.get('/addCouponget',checkSession,productOfferController.addCouponGet)
router.get('/allCoupens',productOfferController.allCoupenget)
router.post('/addCouponPost',checkSession,productOfferController.addCouponPost)
router.get('/deleteCoupon/:id',checkSession,productOfferController.couponDelete)


module.exports=router