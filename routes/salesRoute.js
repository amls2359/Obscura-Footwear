const SalesController = require('../controllers/salesController')
const express = require('express')
const router = express.Router()
const {jwtAuth,jwtAdminAuth} = require('../Middleware/jwtAuth')
const {isUser,isSuperAdmin} = require('../Middleware/roleMiddleware')

router.get('/salesReport', jwtAdminAuth, isSuperAdmin, SalesController.sales)
router.post('/costomSales', jwtAuth, isUser, SalesController.costomSales)
router.get('/salesFilter', jwtAuth, isUser, SalesController.salesFilter)

router.get('/reportPDF', jwtAdminAuth, isSuperAdmin, SalesController.PDFReport)
router.get('/reportExcel', jwtAuth, isUser, SalesController.ExcelReport)

module.exports = router