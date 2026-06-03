const express=require('express')
const router=express.Router()
const cartController=require("../controllers/cartController")
const {checkSessionBlocked}=require('../Middleware/user')
const {isUser} = require('../Middleware/roleMiddleware')
const { jwtAuth } = require('../Middleware/jwtAuth');

router.get('/cart',jwtAuth,isUser,cartController.getcart)
router.post('/addcart/:productId',jwtAuth,isUser,cartController.addToCart)
router.post('/updateQuantity/:productid',jwtAuth,isUser,cartController.updateQuantity)
router.get('/removecart/:productid',jwtAuth,isUser,cartController.removeCartItem)

module.exports=router