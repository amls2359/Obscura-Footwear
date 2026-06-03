
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs') 
const productController =require('../controllers/productController')
const multer = require('multer');
const{jwtAdminAuth} = require('../Middleware/jwtAuth')
const{isSuperAdmin} = require('../Middleware/roleMiddleware')
const {jwtAuth} = require('../Middleware/jwtAuth')
const {isUser} = require('../Middleware/roleMiddleware')

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/images');  // Updated path
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });  // Creates public/images/ if missing
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // Files now save to public/images/
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).array('image');  // No changes needed here

// admin side
router.get('/productmanagement', jwtAdminAuth, isSuperAdmin,    productController.productmanagement)
router.get('/addProduct', jwtAdminAuth, isSuperAdmin, productController.addproductget)
router.post('/addProductPost', upload, jwtAdminAuth, isSuperAdmin, productController.addproductpost)
router.get('/editProduct/:id', jwtAdminAuth, isSuperAdmin, productController.getEditProduct)
router.post('/editProduct/:id', upload, jwtAdminAuth, isSuperAdmin, productController.postEditProduct);
router.get('/unlistProduct/:id', jwtAdminAuth, isSuperAdmin, productController.unlistProduct)
router.post('/deleteimage', jwtAdminAuth, isSuperAdmin, productController.deleteImage)
router.get('/deleteproduct/:id', jwtAdminAuth, isSuperAdmin, productController.getdeleteProduct)

// user side — HTML in browser; JSON when ?format=json or Accept: application/json
router.get('/allproduct', jwtAuth, isUser, productController.getproducts);
router.get('/productdetails/:id', jwtAuth, isUser, productController.productdetails)
router.get('/productfilter', jwtAuth, isUser, productController.productFilter)
module.exports = router