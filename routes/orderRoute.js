const express= require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const {jwtAuth,jwtAdminAuth} = require('../Middleware/jwtAuth')
const {isUser,isSuperAdmin} = require('../Middleware/roleMiddleware')

router.get('/checkout', jwtAuth, isUser, orderController.getCheckout)
router.get('/orderAddress', jwtAuth, isUser, orderController.addAddressCheckout)
router.post('/checkoutaddress', jwtAuth, isUser, orderController.addAddressCheckoutPost)
router.post('/checkoutPost', jwtAuth, isUser, orderController.checkoutPost)
router.get('/placeOrder', jwtAuth, isUser, orderController.placeOrder)
router.get('/userOrderDetails', jwtAuth, isUser, orderController.userOrders)
router.get('/orderDetails/:orderid/:productid', jwtAuth, isUser, orderController.orderDetailsGet)
router.get('/returnOrder/:orderId/:productId', jwtAuth, isUser, orderController.orderReturn)
router.get('/cancelOrder/:orderId/:productId', jwtAuth, isUser, orderController.cancelOrder)
router.get('/Invoice/:orderid', jwtAuth, isUser, orderController.Invoice)

module.exports=router