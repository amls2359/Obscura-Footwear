const SalesController = require('../controllers/salesController')
const express = require('express')
const router = express.Router()
const{checkSession} = require('../Middleware/admin')

router.get('/salesReport',checkSession,SalesController.sales)
router.post('/costomSales',SalesController.costomSales)
router.get('/salesFilter',SalesController.salesFilter)

router.get('/reportPDF',checkSession,SalesController.PDFReport)
router.get('/reportExcel',checkSession,SalesController.ExcelReport)

module.exports = router