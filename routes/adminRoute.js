const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const{checkSession} = require('../Middleware/admin')

router.get('/adminLogin',adminController.adminLogin)
router.post('/adminloginpost',adminController.adminloginpost)

router.get('/dashboard',checkSession,adminController.dashboard)

router.get('/usermanagement',adminController.usermanagement)
router.get('/blockuser/:id',checkSession,adminController.block)
router.get('/unblockuser/:id',adminController.unblock)

router.get('/categorymanagement',checkSession,adminController.categoryManagement)
router.get('/addcategory',checkSession,adminController.addcategoryget)


router.post('/addCategoryPost',adminController.addCategoryPost)
router.get('/unListcategory/:id',checkSession,adminController.UnList)
router.get('/editCategory/:id',checkSession,adminController.editCategoryget)
router.post('/editCategory/:id',checkSession,adminController.editCategorypost)

//category and productoffer




router.get('/orderManagement',checkSession,adminController.orderManagementGet)
router.post('/updateOrder/:orderId/:productId',checkSession,adminController.updateOrderPost)

module.exports=router