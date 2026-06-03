const SalesController = require('../controllers/salesController')
const express = require('express')
const router = express.Router()
const {jwtAuth} = require('../Middleware/jwtAuth')
const {isUser} = require('../Middleware/roleMiddleware')

router.get('/salesReport', jwtAuth, isUser, SalesController.sales)
router.post('/costomSales', jwtAuth, isUser, SalesController.costomSales)
router.get('/salesFilter', jwtAuth, isUser, SalesController.salesFilter)

router.get('/reportPDF', jwtAuth, isUser, SalesController.PDFReport)
router.get('/reportExcel', jwtAuth, isUser, SalesController.ExcelReport)

module.exports = router