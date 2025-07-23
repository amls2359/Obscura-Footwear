// controllers/productController.js
const Product = require('../models/product');
const Category = require('../models/category');
const fs=require('fs')
const path = require('path');
const ProductOffer = require('../models/productOffer')
const CategoryOffer = require('../models/categoryOffer')
const Wishlist = require('../models/wishlist')


const productmanagement = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category');
    // Ensure products have valid prices and filter out products without category
    const validProducts = products
      .filter(product => product.category)
      .map(product => ({
        ...product._doc,
        price: product.price ? Number(product.price) : 0,
        // Ensure image paths are correct
        image: product.image ? product.image.map(img => img.replace(/\\/g, '/')) : [],
        // Ensure brand has a default if empty
        brand: product.brand || 'N/A'
      }));
    res.render("productmanagement", { products: validProducts });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).render("productmanagement", { 
      categories: [], 
      errorMessage: "Error loading product management",
      formData: {}
    });
  }
};

// controllers/productController.js
const addproductget = async (req, res) => {
  try {
    console.log('in');
    
    const categories = await Category.find({ islisted: true }).lean();
    const product= await Product.find({isListed:true}).lean()

    res.render("addProduct", {
        categories: categories || [],
        product:product|| [],
        errorMessage: null,
        formData: {},
        errors: {} // Add this empty errors object
    });
  } catch (error) {
    console.log('error');
    
    console.error("Error fetching categories:", error);
    res.render("addProduct", {
        categories: [],
        product:[],
        errorMessage: "Error loading categories",
        formData: {},
        errors: {} // Add this empty errors object
    });
  }
};

const handleFileUpload = (files) => {
  return new Promise((resolve, reject) => {
    if (!files || files.length === 0) return resolve([]);
    
    const images = [];
    let processed = 0;
    
    files.forEach(file => {
      const newFilename = Date.now() + '-' + file.originalname;
      const uploadPath = path.join(__dirname, '../public/images', newFilename);
      
      fs.rename(file.path, uploadPath, (err) => {
        if (err) return reject(err);
        images.push('images/' + newFilename);
        processed++;
        if (processed === files.length) resolve(images);
      });
    });
  });
};

const addproductpost = async (req, res) => {
  try {
    const { productname, category, price, description, stock, brand } = req.body;
    const errors = {};

    // Validation logic
    if (!productname || productname.trim() === '') {
      errors.productname = 'Product name is required';
    }
    if (!category) {
      errors.category = 'Category is required';
    }
    if (!price || isNaN(price)) {
      errors.price = ' price is required';
    }
    if (!description || description.trim() === '') {
      errors.description = 'Description is required';
    }
    if (!stock || isNaN(stock)) {
      errors.stock = ' stock quantity is required';
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      const categories = await Category.find({ islisted: false }).lean();
      return res.render("addProduct", {
        categories,
        formData: req.body,
        errors,
        errorMessage: "Please correct the errors below"
      });
    }

    // Handle file upload
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await handleFileUpload(req.files);
    }

    // Create new product
    const newProduct = new Product({
      productname,
      category,
      price: parseFloat(price),
      description,
      stock: parseInt(stock),
      image: images,
      brand: brand || 'N/A',
      isListed: req.body.isListed === 'on'
    });

    await newProduct.save();
    res.redirect('/productmanagement');
    
  } catch (error) {
    console.error("Error adding product:", error);
    const categories = await Category.find({ islisted: false }).lean();
    res.render("addProduct", {
      categories,
      formData: req.body,
      errors: {
        general: "An error occurred while adding the product"
      },
      errorMessage: "Failed to add product"
    });
  }
};



const unlistProduct = async (req, res) => {
  try {
    console.log('entered into unlist');
    
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('PRODUCT NOT FOUND');
    }
    product.isListed = !product.isListed;
    console.log(`islisted :${product.isListed}`);
    
    await product.save();
    res.redirect('/productmanagement');
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error changing product status");
  }
};


const getEditProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id }).populate('category');
    const categories = await Category.find().lean();
    res.render('editProduct', { product, categories });
    console.log('Product images:', product.image);
  } catch (err) {
    console.error(err);
    res.status(500).render('editProduct', {
      product: null,
      categories: [],
      errorMessage: 'Failed to get product edit page'
    });
  }
};




const postEditProduct = async (req, res) => {
  try {
    const { productname, category, price, description, stock, isListed, brand } = req.body;
    const productId = req.params.id;

    const existingProduct = await Product.findById(productId);

    let images = existingProduct.image || [];

    // Handle image removal
    const removeImages = req.body.removeImage;
    if (removeImages) {
      const removeArray = Array.isArray(removeImages) ? removeImages : [removeImages];
      images = images.filter(img => !removeArray.includes(img));

      // Optionally delete from filesystem
      removeArray.forEach(img => {
        const filePath = path.join(__dirname, '../public', img);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete image:', err);
          });
        }
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => 'images/' + file.filename);
      images = [...images, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productname,
        category,
        price: parseFloat(price),
        description,
        stock: parseInt(stock),
        brand: brand || 'N/A',
        isListed: isListed === 'on' || isListed === 'true',
        image: images
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Product not found");
    }

    // Update category listings if needed
    const newCategory = await Category.findById(category);
    if (newCategory) {
      newCategory.islisted = true;
      await newCategory.save();
    }

    res.redirect('/productmanagement');
  } catch (err) {
    console.error("Update error:", err);
    const product = await Product.findById(req.params.id).populate('category');
    const categories = await Category.find();
    res.render('editProduct', { 
      product, 
      categories,
      errorMessage: 'Failed to update product' 
    });
  }
};


const deleteImage=async(req,res)=>
{
  const productId=req.body.productId
  const imageIndex=req.body.imageIndex;
  try
  {
    const product=await Product.findById(productId)
    if(!product)
    {
      return res.status(404).send('Product not found')
    }
    if(imageIndex>0|| imageIndex >=product.image.length)
     {
        return res.send(400).send('Invalid image index')
     }
     product.image.splice(imageIndex,1)
     await product.save()
     .then((c)=>{
      console.log('deleted');
      res.status(200).send('Image removed successfully')
      
     })
     .catch((c)=>{
      console.log(err);
      
     })
}
catch(err)
{
  console.log(err);
  res.status(500).send('Internal server error')
  
}
}

const getdeleteProduct= async(req,res)=>
{
  try
  {
    const productId=req.params.id
    console.log('id:',productId);
    await Product.findByIdAndDelete(productId)
    .then((x)=>{
      console.log('product deleted',x);
      res.redirect('/productmanagement')
    })
    .catch((x)=>{
      console.log('error in deleting the product');
      res.redirect('/productmanagement')
      
    })
 }
  catch(err)
  {
    console.log(err);
    res.status(404).send('Internal server error')
  }
}

const getproducts = async (req, res) => {
  try {
    const PAGE_SIZE = 4;

    // Extract filters and sorting from query params
    let {
      page = 1,
      sortprice,
      sortAlphabetically,
      category,
      priceRange
    } = req.query;

    category = category || 'All Categories';
    priceRange = priceRange || '';
    page = parseInt(page) || 1;

    const query = buildQuery(category, priceRange);
    const sortOptions = buildSortOption(sortprice, sortAlphabetically);

    // Get listed categories for sidebar
    const categories = await Category.find({ islisted: true });

    // Step 1: Fetch more products than needed
    const rawProducts = await Product.find(query)
      .sort(sortOptions)
      .populate({
        path: 'category',
        match: { islisted: true },
      })
      .limit(PAGE_SIZE * 5); // Fetch more to allow filtering

    // Step 2: Filter out products with blocked categories
    const validProducts = rawProducts.filter(p => p.category);

    // Step 3: Apply manual pagination after filtering
    const totalPage = Math.ceil(validProducts.length / PAGE_SIZE);
    const paginatedProducts = validProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Step 4: Wishlist handling
    let wishlistProductIds = [];
    if (req.session.userid) {
      const wishlistItems = await Wishlist.find({ userid: req.session.userid });
      wishlistProductIds = wishlistItems.map(item => item.productid.toString());
    }

    paginatedProducts.forEach(product => {
      product.isInWishlist = wishlistProductIds.includes(product._id.toString());
    });

    // Step 5: Build query string for pagination URLs
    let queryString = '';
    if (category && category !== 'All Categories') queryString += `&category=${category}`;
    if (sortprice && sortprice !== 'All Prices') queryString += `&sortprice=${sortprice}`;
    if (priceRange) queryString += `&priceRange=${priceRange}`;
    if (sortAlphabetically) queryString += `&sortAlphabetically=${sortAlphabetically}`;

    // Step 6: Render the view
    res.render('allproduct', {
      productcollection: paginatedProducts,
      currentPage: page,
      totalPage,
      sortprice,
      sortAlphabetically,
      category,
      priceRange,
      categories,
      queryString,
    });

  } catch (error) {
    console.error('Error loading products:', error);
    return res.redirect('/error');
  }
};




const productdetails = async (req, res) => {
    try {
        const pid = req.params.id;
        const product = await Product.findById(pid).populate('category');

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/allproducts');
        }

        let discountAmount = 0;
        let productoffer = null;
        let categoryoffer = null;

        // Check for product offers
        productoffer = await ProductOffer.findOne({ productname: product.productname });
        
        // Check for category offers
        categoryoffer = await CategoryOffer.findOne({ category: product.category._id });

        // Calculate discount based on the best offer
        const originalPrice = parseFloat(product.price);
        let bestDiscountPercentage = 0;

        if (productoffer && productoffer.productoffer > 0) {
            bestDiscountPercentage = productoffer.productoffer;
        }

        if (categoryoffer && categoryoffer.alloffer > bestDiscountPercentage) {
            bestDiscountPercentage = categoryoffer.alloffer;
        }

        // Calculate final price
        discountAmount = (originalPrice * bestDiscountPercentage) / 100;
        const discountedPrice = originalPrice - discountAmount;

        // Get related products
        const relatedProducts = await Product.find({ 
            category: product.category._id,
            _id: { $ne: product._id }
        }).limit(3).populate('category');

        // Check if product is in user's wishlist
        let isInWishlist = false;
        const userId = req.session.userid;
        
        if (userId) {
            const wishlistItem = await Wishlist.findOne({ 
                userid: userId, 
                productid: pid
            });
            isInWishlist = !!wishlistItem;
        }

        res.render('productdetails', {
            product: {
                ...product._doc,
                isInWishlist,
                price: originalPrice,
                discountedPrice: discountedPrice
            },
            relatedProducts,
            productoffer,
            categoryoffer,
            discountAmount,
        });

    } catch (err) {
        console.error('Error in productdetails:', err);
        res.redirect('/allproducts');
    }
};


const productFilter = async (req, res) => {
  try {
    console.log('Entered into product filter');

    const categories = await Category.find({ islisted: true });

    const {
      category,
      sortprice,
      priceRange,
      sortAlphabetically,
      page = 1
    } = req.body;

    const query = buildQuery(category, priceRange);
    const PAGE_SIZE = 4;
    const currentPage = parseInt(page) || 1;

    if (!req.session.userid) {
      return res.status(401).send('Unauthorized');
    }

    // ✅ Step 1: Fetch many more products than needed
    const rawProducts = await Product.find(query)
      .sort(buildSortOption(sortprice, sortAlphabetically))
      .populate({
        path: 'category',
        match: { islisted: true }
      })
      .limit(PAGE_SIZE * 5); // To ensure we have enough valid ones

    // ✅ Step 2: Filter out those with blocked/unlisted categories
    const filteredProducts = rawProducts.filter(p => p.category);

    // ✅ Step 3: Manual pagination using slice
    const totalCount = filteredProducts.length;
    const totalPage = Math.ceil(totalCount / PAGE_SIZE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ✅ Step 4: Build query string for pagination
    let queryString = '';
    if (category && category !== 'All Categories') {
      queryString += `&category=${category}`;
    }
    if (sortprice && sortprice !== 'All Prices') {
      queryString += `&sortprice=${sortprice}`;
    }
    if (priceRange) {
      queryString += `&priceRange=${priceRange}`;
    }
    if (sortAlphabetically) {
      queryString += `&sortAlphabetically=${sortAlphabetically}`;
    }

    // ✅ Step 5: Render the view
    res.render('allproduct', {
      productcollection: paginatedProducts,
      currentPage,
      totalPage,
      sortprice,
      sortAlphabetically,
      category,
      priceRange,
      queryString,
      categories
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal server error');
  }
};


const buildQuery = (category, priceRange) => {
  const query = {
    isListed: true,
    stock: { $gt: 1 }
  };

  // Fix category field name (assuming your model uses `category`, not `Category`)
  if (category && category !== 'All Categories') {
    query.category = category;
  }

  // Handle price range only if valid
  if (priceRange && priceRange !== 'All Prices') {
    const [minPrice, maxPrice] = priceRange.split('-').map(Number);

    // Make sure the range is valid
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }
  }

  return query;
};


const buildSortOption = ( sortprice,sortAlphabetically)=>{
  let sortOption={}
  if(sortprice === 'lowtoHigh')
  {
    sortOption.price=1
  }
  else if(sortprice === 'High to Low')
  {
     sortOption.price= -1
  }

  if(sortAlphabetically === 'ascending')
  {
       sortOption.productname = 1
  }
  else if(sortAlphabetically === 'descending')
  {
     sortOption.productname = -1
  }
  return  sortOption
}


module.exports = 
{
  productmanagement,
  addproductget,
  addproductpost,
  getEditProduct,
  postEditProduct,
  unlistProduct,
  deleteImage,
  getdeleteProduct,
  getproducts,
  productdetails,
  productFilter

};