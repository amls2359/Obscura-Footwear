const express=require('express')
const router=express.Router()
const cartController=require("../controllers/cartController")
const {checkSessionBlocked}=require('../Middleware/user')

router.get('/cart',checkSessionBlocked,cartController.getcart)
router.post('/addcart/:productId',checkSessionBlocked,cartController.addToCart)
router.post('/updateQuantity/:productid',cartController.updateQuantity)
router.get('/removecart/:productid',cartController.removeCartItem)

module.exports=router