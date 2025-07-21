const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs') 
const productController =require('../controllers/productController')
const multer = require('multer');
const {checkSessionBlocked} = require('../Middleware/user')


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

// const checkSessionBlocked=async(req,res,next)=>{
//     if(req.session.admin)
//     {
//         next()
//     }
//     else
//     {
//         res.redirect('/admin/adminLogin')
//     }
// }
// admin side
router.get('/productmanagement', productController.productmanagement)
router.get('/addProduct', productController.addproductget)
router.post('/addProductPost', upload, productController.addproductpost)
router.get('/editProduct/:id',productController.getEditProduct)
router.post('/editProduct/:id', upload, productController.postEditProduct);
router.get('/unlistProduct/:id',productController.unlistProduct)
router.post('/deleteimage',productController.deleteImage)
router.get('/deleteproduct/:id',productController.getdeleteProduct)

//user side
router.get('/allproduct',checkSessionBlocked,productController.getproducts)
router.get('/productdetails/:id',checkSessionBlocked,productController.productdetails)  
router.post('/productfilter',checkSessionBlocked,productController.productFilter)
module.exports = router