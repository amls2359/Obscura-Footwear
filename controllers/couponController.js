const Product = require('../models/product')
const Category = require('../models/category')
const CategoryOffer = require('../models/categoryOffer')
const ProductOffer = require('../models/productOffer')
const Coupon = require('../models/coupon') 
const OrderCollection=require('../models/order')




//coupon 



const coupenCheck = async(req,res)=>
{
    try
    {
      console.log('entered into coupon check');
      let currentDate= new Date()
      const coupencode=req.body.coupencode
      console.log('coupencode is :',coupencode);
      const allcoupons= await Coupon.find({})
      console.log('all coupons:',allcoupons);
      
      

      if(req.session.coupon &&coupencode.toLowerCase() === req.session.coupencode.toLowerCase())
      {   console.log('inside the coupon session'); 
          return res.status(400).json({
            success:false,
            message: 'coupon code has already been applied'
          })
      }
      console.log('coupon session value isccoupen',req.session.coupon);
      console.log('coupon session value is  coupencode',req.session.coupencode);

      const coupon = await Coupon.findOne({
         coupencode:{$regex:new RegExp(coupencode,'i')}})
       console.log(coupon && coupon.expiredate > currentDate)
       if(coupon && coupon.expiredate > currentDate && coupencode.toLowerCase()=== coupon.coupencode.toLowerCase())
       {  console.log('inside if');
          const discountAmount =  coupon.discount
          const amountLimit = coupon. purchaseamount
          req.session.coupencode = coupon.coupencode
         req.session.coupon = true;

          return res.json({success:true,discount:discountAmount,amount:amountLimit})
       }
       else
       {
        console.log('inside the expire');
        return res.status(400).json({
            success:false,
            message:'invalid coupon code or expired'
        })
       }
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:'internal server error during coupon validation '
        })
    }
}

const couponRemove = async(req,res)=>
{
    try
    {
        const{coupencode}=req.body
        await OrderCollection.updateMany({},{$set:{Discount: 0, intDiscount:0}})

        // send a success response
        req.session.coupencode=null
        req.session.coupon=null
        res.json({success:true})
    }
    catch(error)
    {
      console.log('error deleting coupon',error);
      res.json({success:false})
      
    }
}


const couponManagementGet = async(req,res)=>
{
    try
    {
         const showcoupons= await Coupon.find({})
         console.log(showcoupons);
        res.render('couponManagement',{showcoupons})
    }
    catch(error)
    {
      console.log(error);
      return res.status(404).send('No coupon found')
    }
}

const productOfferGet = async(req,res) => {
    try {
        const productOffer = await ProductOffer.find({});
        const categoryOffer = await CategoryOffer.find({})
            .populate({
                path: 'category',
                match: { islisted: true }
            });
        
        // Filter out null categories (those that didn't match islisted:true)
        const filteredCategoryOffers = categoryOffer.filter(offer => offer.category !== null);
        
        res.render('offerManagement', {
            productOffer,
            categoryOffer: filteredCategoryOffers
        });
    } catch(error) {
        console.log(error);
        res.status(500).send('Internal Server error');
    }
}

const addProductOffer = async(req,res)=>
{
    try
    {
        const products = await Product.find({},'productname')
        res.render('addProductOffer',{products})
    }
    catch(error)
    {
      console.log(error);
      res.status(500).send('Internal server error')
      
    }
}

const addProductOfferPost = async (req, res) => {
    console.log('entered into post request');
    
    try {
        const productOffer = {
            productname: req.body.productname,
            price: req.body.productprice,
            productoffer: req.body.productoffer,
        };
        
        console.log('this is the product offer:', productOffer);
        const newProductOffer = await ProductOffer.create(productOffer);
        console.log(`this is the new product offer:${newProductOffer}`);
        res.redirect('/offerManagement');
    } 
    catch(error) {
        console.log('insert failed', error);
        // Get products again to pass to the view
        const products = await Product.find({}); // Assuming you're using a Product model
        res.render('addProductOffer', { 
            errorMessage: 'Failed to add product offer. Please try again.',
            products: products // Pass the products array
        });
    }
};

const categoryOfferGet = async (req,res)=>
{
    try
    {
        const categories = await Category.find({islisted:true},'name')
        res.render('addCategoryOffer',{categories})
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send('Internal server error')
    }
}

const AddCategoryPost = async(req,res)=>
{
    try
    {
        const categoryoffer=
        {
             category :req.body.category,
             alloffer: req.body.alloffer
        }
        const newCategoryOffer = await CategoryOffer.create(categoryoffer)
        console.log(`new category offer added ${newCategoryOffer }`);
        res.redirect('/offerManagement')
    }
    catch(error)
    {
        console.log('failed to add category offer',error);
        res.redirect('/addCategoryOffer')
        
    }
}

const deleteProductOffer = async(req,res)=>
{
    try
    {
        const productOfferid = req.params.id;
        console.log(`productofferid is ${productOfferid}`);
        await ProductOffer.findByIdAndDelete(productOfferid)
        res.redirect('/offerManagement')
    }
    catch(error)
    {
       console.log(error);
       return res.status(500).send('failed to delete offer')
    }
}

const deleteCategoryOffer= async(req,res)=>
{
    try
    {
       const categoryid = req.params.id;
       console.log(`category id is ${categoryid}`);
       await CategoryOffer.findByIdAndDelete(categoryid)
       res.redirect('/offerManagement')
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).send('Failed to delete offer')  
    }
}

const addCouponGet= async(req,res)=>
{
    try
    {
      res.render('addCoupon')
    }
    catch(error)
    {
        console.log(error);
        return res.send(404).status('coupon page is not found')
    }
}

const allCoupenget = async(req,res)=>
{
    try
    {
      const showCoupens = await Coupon.find() 
      res.render('allCoupens',{showCoupens})
    }
    catch(error)
    {
        console.log(error);
        res.status(404).send('cannot find any coupens')
        
    }
}

const addCouponPost = async(req,res)=>
{
    try
    {
        console.log('entered into coupon');
        
    const coupon =
    {
        coupencode:req.body.couponcode,
        discount:req.body.discount,
        expiredate:req.body.expiredate,
        purchaseamount:req.body.purchaseamount
    }
      console.log(coupon);
     const newCoupon= await Coupon .create(coupon)
     console.log(newCoupon);
     res.redirect('/couponManagement')
}
    catch(error)
    {
        console.log(error);
        return res.status(404).send('cannot add the coupon')
        
    }
}

const couponDelete = async(req,res)=>
{
    try
    {
     const couponid = req.params.id
     console.log(couponid);
     await Coupon.findByIdAndDelete(couponid)
     res.redirect('/couponManagement')
    }
   catch(error)
   {
     console.log(error);
     return res.status(404).send('cannot delete coupon')
     
   }

}


module.exports=
{
 
    coupenCheck,
    couponRemove,
     addCouponPost,
    couponDelete,
    allCoupenget,
    addCouponGet,
    deleteCategoryOffer,
    deleteProductOffer,
    AddCategoryPost,
    categoryOfferGet,
    addProductOfferPost,
    addProductOffer,
    productOfferGet,
    couponManagementGet 
}