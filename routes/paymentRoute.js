const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

router.post('/create/orderId',paymentController.orderPayment)
router.get('/paymentFailed',paymentController.paymentFailed)


module.exports = router