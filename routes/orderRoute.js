const express= require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')

const {checkSessionBlocked}=require('../Middleware/user')

router.get('/checkout',checkSessionBlocked,orderController.getCheckout)
router.get('/orderAddress',checkSessionBlocked,orderController.addAddressCheckout)
router.post('/checkoutaddress',checkSessionBlocked,orderController.addAddressCheckoutPost)
router.post('/checkoutPost',checkSessionBlocked,orderController.checkoutPost)
router.get('/placeOrder',checkSessionBlocked,orderController.placeOrder)
router.get('/userOrderDetails',checkSessionBlocked,orderController.userOrders)
router.get('/orderDetails/:orderid/:productid',checkSessionBlocked,orderController.orderDetailsGet)
router.get('/returnOrder/:userId/:productId',orderController.orderReturn)
router.get('/cancelOrder/:orderId/:productId',checkSessionBlocked,orderController.cancelOrder)
router.get('/Invoice/:orderid',orderController.Invoice)

module.exports=router