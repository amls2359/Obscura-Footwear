// controllers/productController.js
const Product = require('../models/product');
const Category = require('../models/category');
const fs = require('fs')
const path = require('path');
const ProductOffer = require('../models/productOffer')
const CategoryOffer = require('../models/categoryOffer')
const Wishlist = require('../models/wishlist')
const {
  successResponse,
  errorResponse,
  wantsJsonResponse,
} = require('../utils/reposnseHandler');

const formatProductManagementForJson = (product) => ({
  _id: product._id,
  productname: product.productname,
  category: product.category?._id
    ? { _id: product.category._id, name: product.category.name }
    : { name: product.category?.name || 'Unknown / Missing' },
  price: product.price,
  stock: product.stock,
  brand: product.brand || 'N/A',
  image: product.image || [],
  isListed: product.isListed,
});

const productmanagement = async (req, res) => {
  const json = wantsJsonResponse(req);

  try {
    const products = await Product.find({}).populate('category');
    const withCategory = products.filter((p) => p.category).length;
    console.log(
      `[productmanagement] Total: ${products.length}, With category: ${withCategory}, Missing category: ${products.length - withCategory}`
    );

    const validProducts = products.map((product) => ({
      ...product._doc,
      category: product.category || { name: 'Unknown / Missing' },
      price: product.price ? Number(product.price) : 0,
      image: product.image ? product.image.map((img) => img.replace(/\\/g, '/')) : [],
      brand: product.brand || 'N/A',
    }));

    if (json) {
      return successResponse(res, 'Product management list fetched successfully', {
        count: validProducts.length,
        total: products.length,
        withCategory,
        missingCategory: products.length - withCategory,
        products: validProducts.map(formatProductManagementForJson),
      });
    }

    return res.render('productmanagement', { products: validProducts });
  } catch (error) {
    console.error('Error:', error);
    if (json) return errorResponse(res, 'Error loading product management', 500);
    return res.status(500).render('productmanagement', {
      products: [],
      categories: [],
      errorMessage: 'Error loading product management',
      formData: {},
    });
  }
};

const getProductsApi = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category').lean();
    return successResponse(res, 'Products fetched successfully', {
      count: products.length,
      products: products.map((product) => ({
        _id: product._id,
        productname: product.productname,
        category: product.category
          ? { _id: product.category._id, name: product.category.name }
          : null,
        price: product.price,
        stock: product.stock,
        brand: product.brand || 'N/A',
        isListed: product.isListed,
        image: product.image || [],
      })),
    });
  } catch (error) {
    console.error('[api/products] Error:', error);
    return errorResponse(res, 'Failed to fetch products', 500);
  }
};

const getProductPage = async (req, res) => {
  try {
    const products = await Product.find({}).populate('category').lean();
    res.render('allproduct', { products })
  }
  catch (error) {
    res.status(500).render('error', { message: 'Failed to load products' })
  }
}

// controllers/productController.js
const addproductget = async (req, res) => {
  try {
    console.log('in');

    const categories = await Category.find({ islisted: true }).lean();
    const product = await Product.find({ isListed: true }).lean()

    res.render("addProduct", {
      categories: categories || [],
      product: product || [],
      errorMessage: null,
      formData: {},
      errors: {} // Add this empty errors object
    });
  } catch (error) {
    console.log('error');

    console.error("Error fetching categories:", error);
    res.render("addProduct", {
      categories: [],
      product: [],
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
      newCategory.isListed = true;
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


const deleteImage = async (req, res) => {
  const productId = req.body.productId
  const imageIndex = req.body.imageIndex;
  try {
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).send('Product not found')
    }
    if (imageIndex > 0 || imageIndex >= product.image.length) {
      return res.send(400).send('Invalid image index')
    }
    product.image.splice(imageIndex, 1)
    await product.save()
      .then((c) => {
        console.log('deleted');
        res.status(200).send('Image removed successfully')

      })
      .catch((c) => {
        console.log(err);

      })
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Internal server error')

  }
}

const getdeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id
    console.log('id:', productId);
    await Product.findByIdAndDelete(productId)
      .then((x) => {
        console.log('product deleted', x);
        res.redirect('/productmanagement')
      })
      .catch((x) => {
        console.log('error in deleting the product');
        res.redirect('/productmanagement')

      })
  }
  catch (err) {
    console.log(err);
    res.status(404).send('Internal server error')
  }
}

const formatAllProductForJson = (product) => ({
  _id: product._id,
  productname: product.productname,
  category: product.category
    ? { _id: product.category._id, name: product.category.name }
    : null,
  price: product.price,
  stock: product.stock,
  brand: product.brand || 'N/A',
  image: product.image || [],
  isListed: product.isListed,
  isInWishlist: !!product.isInWishlist,
});

const formatRelatedProductForJson = (product) => ({
  _id: product._id,
  productname: product.productname,
  price: product.price,
  image: product.image || [],
  category: product.category
    ? { _id: product.category._id, name: product.category.name }
    : null,
});

const formatProductDetailForJson = (product, pricing) => ({
  _id: product._id,
  productname: product.productname,
  description: product.description,
  model: product.model,
  brand: product.brand || 'N/A',
  stock: product.stock,
  image: product.image || [],
  isListed: product.isListed,
  category: product.category
    ? { _id: product.category._id, name: product.category.name }
    : null,
  price: pricing.originalPrice,
  discountedPrice: pricing.discountedPrice,
  discountAmount: pricing.discountAmount,
  isInWishlist: pricing.isInWishlist,
});

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

    console.log("RAW PRODUCTS:", rawProducts.length);

    console.log(
      "CATEGORY STATUS:",
      rawProducts.map(product => ({
        name: product.productname,
        category: product.category
      }))
    );

    const testProduct = await Product.findOne();
    console.log("PRODUCT CATEGORY ID:", testProduct.category);

    const testCategory = await Category.findById(testProduct.category);
    console.log("FOUND CATEGORY:", testCategory);

    console.log("RAW PRODUCTS:", rawProducts.length);

    // Step 2: Filter out products with blocked categories
    const validProducts = rawProducts.filter(p => p.category);

    // Step 3: Apply manual pagination after filtering
    const totalPage = Math.ceil(validProducts.length / PAGE_SIZE) || 1;
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

    // Step 6: JSON or HTML response
    if (wantsJsonResponse(req)) {
      return successResponse(res, 'Products fetched successfully', {
        currentPage: page,
        totalPage,
        pageSize: PAGE_SIZE,
        totalProducts: validProducts.length,
        filters: {
          category,
          priceRange,
          sortprice: sortprice || null,
          sortAlphabetically: sortAlphabetically || null,
        },
        categories: categories.map((c) => ({ _id: c._id, name: c.name })),
        products: paginatedProducts.map(formatAllProductForJson),
        queryString,
      });
    }

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
    if (wantsJsonResponse(req)) {
      return errorResponse(res, 'Error loading products', 500);
    }
    return res.redirect('/error');
  }
};




const productdetails = async (req, res) => {
  try {
    const pid = req.params.id;
    const product = await Product.findById(pid).populate('category');

    if (!product) {
      if (wantsJsonResponse(req)) {
        return errorResponse(res, 'Product not found', 404);
      }
      req.flash('error', 'Product not found');
      return res.redirect('/allproduct');
    }

    let discountAmount = 0;
    let productoffer = null;
    let categoryoffer = null;

    productoffer = await ProductOffer.findOne({ productname: product.productname });

    if (product.category) {
      categoryoffer = await CategoryOffer.findOne({ category: product.category._id });
    }

    const originalPrice = parseFloat(product.price);
    let bestDiscountPercentage = 0;

    if (productoffer && productoffer.productoffer > 0) {
      bestDiscountPercentage = productoffer.productoffer;
    }

    if (categoryoffer && categoryoffer.alloffer > bestDiscountPercentage) {
      bestDiscountPercentage = categoryoffer.alloffer;
    }

    discountAmount = (originalPrice * bestDiscountPercentage) / 100;
    const discountedPrice = originalPrice - discountAmount;

    const relatedProducts = product.category
      ? await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isListed: true,
      })
        .limit(3)
        .populate('category')
      : [];

    let isInWishlist = false;
    const userId = req.session.userid;

    if (userId) {
      const wishlistItem = await Wishlist.findOne({
        userid: userId,
        productid: pid,
      });
      isInWishlist = !!wishlistItem;
    }

    const pricing = {
      originalPrice,
      discountedPrice,
      discountAmount,
      isInWishlist,
    };

    if (wantsJsonResponse(req)) {
      // Format product data for JSON response
      const productData = {
        _id: product._id,
        productname: product.productname,
        description: product.description,
        category: product.category ? {
          _id: product.category._id,
          name: product.category.name
        } : null,
        originalPrice: pricing.originalPrice,
        discountedPrice: pricing.discountedPrice,
        discountAmount: pricing.discountAmount,
        discountPercentage: bestDiscountPercentage,
        stock: product.stock,
        brand: product.brand || 'N/A',
        isListed: product.isListed,
        image: product.image || [],
        isInWishlist: pricing.isInWishlist,
      };

      // Format related products
      const formattedRelatedProducts = relatedProducts.map(relatedProduct => ({
        _id: relatedProduct._id,
        productname: relatedProduct.productname,
        price: relatedProduct.price,
        category: relatedProduct.category ? {
          _id: relatedProduct.category._id,
          name: relatedProduct.category.name
        } : null,
        image: relatedProduct.image?.[0] || null,
        stock: relatedProduct.stock,
      }));

      // Prepare offers data
      const offers = {
        productOffer: productoffer ? {
          productname: productoffer.productname,
          discount: productoffer.productoffer
        } : null,
        categoryOffer: categoryoffer ? {
          categoryId: categoryoffer.category,
          discount: categoryoffer.alloffer
        } : null,
        bestDiscount: bestDiscountPercentage
      };

      // Return success response with all data
      return successResponse(res, 'Product details fetched successfully', {
        product: productData,
        relatedProducts: formattedRelatedProducts,
        offers: offers,
        pricing: {
          originalPrice: pricing.originalPrice,
          discountedPrice: pricing.discountedPrice,
          discountAmount: pricing.discountAmount,
          discountPercentage: bestDiscountPercentage,
          youSave: pricing.discountAmount > 0 ? pricing.discountAmount : 0
        }
      });
    }

    // Render HTML for browser requests
    res.render('productdetails', {
      product: {
        ...product._doc,
        isInWishlist,
        price: originalPrice,
        discountedPrice,
      },
      relatedProducts,
      productoffer,
      categoryoffer,
      discountAmount,
    });
  } catch (err) {
    console.error('Error in productdetails:', err);
    if (wantsJsonResponse(req)) {
      return errorResponse(res, 'Error loading product details', 500);
    }
    req.flash('error', 'Error loading product details');
    return res.redirect('/allproduct');
  }
};


const productFilter = async (req, res) => {
  const json = wantsJsonResponse(req);

  try {
    const categories = await Category.find({ islisted: true });

    const {
      category = 'All Categories',
      sortprice,
      priceRange = '',
      sortAlphabetically,
      page = 1,
    } = { ...req.query, ...req.body };

    const query = buildQuery(category, priceRange);
    const PAGE_SIZE = 4;
    const currentPage = parseInt(page) || 1;

    if (!json && !req.session.userid) {
      return res.status(401).send('Unauthorized');
    }

    const rawProducts = await Product.find(query)
      .sort(buildSortOption(sortprice, sortAlphabetically))
      .populate({
        path: 'category',
        match: { islisted: true },
      })
      .limit(PAGE_SIZE * 5);

    const filteredProducts = rawProducts.filter((p) => p.category);
    const totalCount = filteredProducts.length;
    const totalPage = Math.ceil(totalCount / PAGE_SIZE) || 1;
    const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

    let wishlistProductIds = [];
    if (req.session.userid) {
      const wishlistItems = await Wishlist.find({ userid: req.session.userid });
      wishlistProductIds = wishlistItems.map((item) => item.productid.toString());
    }

    paginatedProducts.forEach((product) => {
      product.isInWishlist = wishlistProductIds.includes(product._id.toString());
    });

    let queryString = '';
    if (category && category !== 'All Categories') queryString += `&category=${category}`;
    if (sortprice && sortprice !== 'All Prices') queryString += `&sortprice=${sortprice}`;
    if (priceRange) queryString += `&priceRange=${priceRange}`;
    if (sortAlphabetically) queryString += `&sortAlphabetically=${sortAlphabetically}`;

    const responseData = {
      currentPage,
      totalPage,
      pageSize: PAGE_SIZE,
      totalProducts: totalCount,
      filters: {
        category,
        priceRange,
        sortprice: sortprice || null,
        sortAlphabetically: sortAlphabetically || null,
      },
      categories: categories.map((c) => ({ _id: c._id, name: c.name })),
      products: paginatedProducts.map(formatAllProductForJson),
      queryString,
    };

    if (json) {
      return successResponse(res, 'Products filtered successfully', responseData);
    }

    return res.render('allproduct', {
      productcollection: paginatedProducts,
      currentPage,
      totalPage,
      sortprice,
      sortAlphabetically,
      category,
      priceRange,
      queryString,
      categories,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    if (json) return errorResponse(res, 'Error filtering products', 500);
    return res.status(500).send('Internal server error');
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


const buildSortOption = (sortprice, sortAlphabetically) => {
  let sortOption = {}
  if (sortprice === 'lowtoHigh') {
    sortOption.price = 1
  }
  else if (sortprice === 'High to Low') {
    sortOption.price = -1
  }

  if (sortAlphabetically === 'ascending') {
    sortOption.productname = 1
  }
  else if (sortAlphabetically === 'descending') {
    sortOption.productname = -1
  }
  return sortOption
}


module.exports =
{
  productmanagement,
  getProductsApi,
  getProductPage,
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