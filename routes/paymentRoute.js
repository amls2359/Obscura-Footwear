const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const {jwtAuth} = require('../Middleware/jwtAuth')
const {isUser} = require('../Middleware/roleMiddleware')

router.post('/create/orderId', jwtAuth, isUser, paymentController.orderPayment)
router.get('/paymentFailed', jwtAuth, isUser, paymentController.paymentFailed)


module.exports = router