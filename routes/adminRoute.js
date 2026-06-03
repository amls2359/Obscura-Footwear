const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const{checkSession} = require('../Middleware/admin')
const { jwtAdminAuth } = require('../Middleware/jwtAuth');
const { verifyAdminAccessToken } = require('../config/jwtConfig');
const { isSuperAdmin } = require('../Middleware/roleMiddleware');


router.get('/adminLogin',adminController.adminLogin)
router.post('/adminloginpost',adminController.adminLoginPost)

router.get('/dashboard',jwtAdminAuth,isSuperAdmin,adminController.dashboard)

router.get('/usermanagement',jwtAdminAuth,isSuperAdmin,adminController.usermanagement)
router.get('/blockuser/:id',jwtAdminAuth,isSuperAdmin,adminController.block)
router.get('/unblockuser/:id',jwtAdminAuth,isSuperAdmin,adminController.unblock)

router.get('/categorymanagement',jwtAdminAuth,isSuperAdmin,adminController.categoryManagement)
router.get('/addcategory',jwtAdminAuth,isSuperAdmin,adminController.addcategoryget)


router.post('/addCategoryPost',jwtAdminAuth,isSuperAdmin,adminController.addCategoryPost)
router.get('/unListcategory/:id',jwtAdminAuth,isSuperAdmin,adminController.UnList)
router.get('/editCategory/:id',jwtAdminAuth,isSuperAdmin,adminController.editCategoryget)
router.post('/editCategory/:id',jwtAdminAuth,isSuperAdmin,adminController.editCategorypost)

//category and productoffer


router.get('/orderManagement',jwtAdminAuth,isSuperAdmin,adminController.orderManagementGet)
router.post('/updateOrder/:orderId/:productId',jwtAdminAuth,isSuperAdmin,adminController.updateOrderPost)

module.exports=router