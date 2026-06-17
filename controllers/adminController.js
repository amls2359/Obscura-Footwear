
const Product=require('../models/product')
const UserCollection =require('../models/user')
const Category=require('../models/category')
const CategoryOffer = require('../models/categoryOffer')
const ProductOffer = require('../models/productOffer')
const OrderCollection = require('../models/order')
const SuperAdmin = require('../models/admin');
const bcrypt = require('bcrypt');
const {
  generateSuperAdminTokens,
  verifyAdminAccessToken,
} = require('../config/jwtConfig');
const {
  successResponse,
  errorResponse,
  wantsJsonResponse,
} = require('../utils/reposnseHandler');

const adminLogin=(req,res)=>res.render('adminLogin')


const dashboard = async (req, res) => {
    console.log('entered into dashboard');

    if (req.user?.isSuperAdmin || req.session.isSuperAdmin || req.session.admin) {
        try {
            const dailyOrders = await OrderCollection.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            console.log(`daily orders: ${JSON.stringify(dailyOrders)}`);

            const { dates, orderCounts, totalOrderCount } = dailyOrders.reduce(
                (result, order) => {
                    result.dates.push(order._id);
                    result.orderCounts.push(order.orderCount);
                    result.totalOrderCount += order.orderCount;
                    return result;
                },
                { dates: [], orderCounts: [], totalOrderCount: 0 }
            );

            const monthlyOrders = await OrderCollection.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$orderDate' },
                            month: { $month: '$orderDate' }
                        },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            console.log(`monthly orders: ${JSON.stringify(monthlyOrders)}`);

            const monthlyData = monthlyOrders.reduce((result, order) => {
                const monthYearString = `${order._id.year}-${String(order._id.month).padStart(2, '0')}`;
                result.push({
                    month: monthYearString,
                    orderCount: order.orderCount
                });
                return result;
            }, []);

            const yearlyOrders = await OrderCollection.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y', date: '$orderDate' } },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            console.log(`yearly orders: ${JSON.stringify(yearlyOrders)}`);

            const { years, orderCounts3, totalOrderCount3 } = yearlyOrders.reduce(
                (result, order) => {
                    result.years.push(order._id);
                    result.orderCounts3.push(order.orderCount);
                    result.totalOrderCount3 += order.orderCount;
                    return result;
                },
                { years: [], orderCounts3: [], totalOrderCount3: 0 }
            );

            const topsellingProduct = await OrderCollection.aggregate([
                { $unwind: '$productCollection' },
                {
                    $group: {
                        _id: '$productCollection.productid',
                        totalQuantity: { $sum: '$productCollection.quantity' },
                        productname: { $first: '$productCollection.productname' }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 }
            ]);

            topsellingProduct.sort((a, b) => b.totalQuantity - a.totalQuantity);
            console.log('top selling products:', topsellingProduct);

            const productNames = topsellingProduct.map((product) => product.productname);
            console.log('product names in descending order:', productNames);

            const categories = [];

            for (const productname of productNames) {
                const productDoc = await Product.findOne({ productname }).populate('category');
                console.log(`product document: ${productDoc}`);

                if (productDoc && productDoc.category) {
                    categories.push(productDoc.category.name);
                } else {
                    console.warn('product not found or category missing:', productname);
                }
            }

            const categoryCount = {};
            categories.forEach((category) => {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });

            const sortedCategoryCount = Object.entries(categoryCount)
                .sort((a, b) => b[1] - a[1])
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});

            const entriesArray = Object.entries(sortedCategoryCount);
            console.log('entries array:', entriesArray);

            const productNamess = [];
            const sellingQuantities = [];
            topsellingProduct.forEach((product) => {
                productNamess.push(product.productname);
                sellingQuantities.push(product.totalQuantity);
            });

            const topsellingbrand = await OrderCollection.aggregate([
                { $unwind: '$productCollection' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productCollection.productid',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                { $unwind: '$productDetails' },
                {
                    $group: {
                        _id: '$productDetails.brand',
                        totalQuantity: { $sum: '$productCollection.quantity' }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 }
            ]);

            console.log('top selling brands:', topsellingbrand);

            const brandNames = topsellingbrand.map((brand) => brand._id);
            const brandQuantities = topsellingbrand.map((brand) => brand.totalQuantity);

            // Send data to the view
            res.render('dashboard', {
                dates,
                orderCounts,
                totalOrderCount,
                monthlyData,
                years,
                orderCounts3,
                totalOrderCount3,
                productNamess,
                sellingQuantities,
                entriesArray,
                brandNames,
                brandQuantities
            });
        } catch (error) {
            console.error('Error in dashboard:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/admin/adminlogin');
    }
};

  
const adminLoginPost = async (req, res) => {
    try {
        console.log('entered into admin login');

        const { email, password } = req.body;

        const wantsJson =
            req.headers['accept']?.includes('application/json') ||
            req.headers['content-type']?.includes('application/json') ||
            req.xhr;

        // Find admin
        const user = await SuperAdmin.findOne({ email });

        if (!user) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }

            return res.render('adminLogin', {
                errorMessage: 'Invalid email or password',
                successMessage: null,
            });
        }

        // Allow only super admin
        if (user.role !== 'superAdmin' || !user.isSuperAdmin) {
            if (wantsJson) {
                return res.status(403).json({
                    success: false,
                    message:
                        'Access denied. Only Super Admin can access this portal.',
                });
            }

            return res.render('adminLogin', {
                errorMessage:
                    'Access denied. Only Super Admin can access this portal.',
                successMessage: null,
            });
        }

        // Check blocked status
        if (user.isblocked) {
            if (wantsJson) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been blocked.',
                });
            }

            return res.render('adminLogin', {
                errorMessage: 'Your account has been blocked.',
                successMessage: null,
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        console.log(`Valid password: ${validPassword}`);

        if (!validPassword) {
            if (wantsJson) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }

            return res.render('adminLogin', {
                errorMessage: 'Invalid email or password',
                successMessage: null,
            });
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } =
            generateSuperAdminTokens(user);
        await user.save();

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000, // 2 hours
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        console.log('✅ Admin JWT cookies set successfully');

        if (wantsJson) {
            return res.status(200).json({
                success: true,
                message: 'Super Admin login successful',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        role: 'superAdmin',
                        isSuperAdmin: true,
                    },
                    tokenExpiry: {
                        accessTokenExpiry:
                            process.env.JWT_SUPERADMIN_ACCESS_EXPIRY || '2h',
                        refreshTokenExpiry:
                            process.env.JWT_SUPERADMIN_REFRESH_EXPIRY || '30d',
                    },
                },
            });
        }

        return res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('Admin login error:', error);

        if (
            req.headers['accept']?.includes('application/json')
        ) {
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            });
        }

        return res.render('adminLogin', {
            errorMessage: 'Internal Server Error',
            successMessage: null,
        });
    }
};


const formatUserForJson = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
  phone: user.phone,
  wallet: user.wallet,
  referralcode: user.referralcode,
  isblocked: user.isblocked,
  isDeleted: user.isDeleted,
  googleId: user.googleId ? true : false,
});

const usermanagement = async (req, res) => {
  const json = wantsJsonResponse(req);

  try {
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const [userdata, totalUsers] = await Promise.all([
      UserCollection.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 })
        .lean(),
      UserCollection.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalUsers / limit) || 1;
    const pagination = {
      currentPage: page,
      totalPages,
      totalUsers,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    const responseData = {
      users: userdata.map(formatUserForJson),
      pagination,
      searchQuery,
    };

    // Postman / fetch: pure JSON on the same route (no extra API path)
    if (json) {
      return successResponse(res, 'Users fetched successfully', responseData);
    }

    // Browser: render HTML and embed the same JSON for client-side use
    return res.render('usermanagement', {
      userdata,
      searchQuery,
      pagination,
      responseData: JSON.stringify({
        success: true,
        message: 'Users fetched successfully',
        data: responseData,
      }),
    });
  } catch (error) {
    console.error('User management error:', error);
    if (json) return errorResponse(res, 'Failed to fetch users', 500);
    return res.status(500).render('error', {
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
};

const block = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserCollection.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.isblocked = true; // Block the user
        await user.save();
        res.redirect('/admin/usermanagement');
    } catch (err) {
        console.log(err);
        return res.status(500).send('Failed to block user');
    }
};

const unblock = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserCollection.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.isblocked = false; // Unblock the user
        await user.save();
        res.redirect('/admin/usermanagement');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Failed to unblock user');
    }
};

const categoryManagement = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.render("categorymanagement", { categories });
    } catch (error) {
        console.log("Error fetching categories:", error);
        res.status(500).send("Internal server error");
    }
};

const addcategoryget = async (req, res) => {
    try {
        res.render("addcategory");
    } catch (error) {
        console.log("error", error);
        res.status(500).send("internal server error");
    }
};

const addCategoryPost = async (req, res) => {
    const name = req.body.name.trim();
    
    try {
        // Check if category already exists (case-insensitive)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp("^" + name + "$", "i") }
        });

        if (existingCategory) {
            return res.render("addcategory", {
                errorMessage: "Category already exists!",
                successMessage: null
            });
        }

        const newCategory = new Category({
            name: name,  // Using 'name' field consistently
            islisted: true
        });

        await newCategory.save();
        res.redirect("/admin/categorymanagement");
    } catch (err) {
        console.error("Error inserting category:", err);
        res.status(500).send("Error inserting category");
    }
};

const UnList = async (req, res) => {    
    try {
      // Find the category by ID
      const category = await Category.findOne({ _id: req.params.id });
  
      if (!category) {
        // return res.status(404).send("Category not found.");
      }
  
      // Update the 'islisted' field to its opposite value
      category.islisted = !category.islisted;
  
      // Save the updated category
      await category.save();
      res.redirect("/admin/categorymanagement");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Failed to toggle category block status.");
    }
}

const editCategoryget = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("Fetching category with ID:", id);
        const category = await Category.findOne({ _id: id });
        console.log("Category found:", category);
        res.render("editcategory", { 
            category: category,
            message: null // Initialize message as null
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to display the category edit page.");
    }
}

const editCategorypost = async (req, res) => {
    try {
        const id = req.params.id;
        const categoryname = req.body.categoryname ? req.body.categoryname.trim() : null;

        // Fetch the category details from the database first
        const category = await Category.findById(id);

        if (!categoryname) {
            return res.render('editcategory', { 
                message: "Category name is required!", 
                category: category // Pass the existing category back to the form
            });
        }

        console.log(`this is the id ${id} and this is the categoryname ${categoryname}`);

        // Check if there's already a category with the new name
        const existingCategory = await Category.findOne({
            category: { $regex: new RegExp("^" + categoryname + "$", "i") },
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.render('editcategory', { 
                message: "Category already exists!", 
                category: category // Pass the existing category back to the form
            });
        }

        // Update the category name
        await Category.updateOne(
            { _id: id },
            { $set: { category: categoryname } }
        );

        // Redirect to category management page upon successful update
        return res.redirect("/admin/categorymanagement");
    } catch (err) {
        console.error("Error editing category:", err);
        // In case of error, render the form again with the original category data
        const category = await Category.findById(id);
        return res.render('editcategory', { 
            message: "Failed to edit category.", 
            category: category 
        });
    }
}



const orderManagementGet = async(req,res)=>
{
  try
  {
     console.log('entred into order management');
     const orderdetail = await OrderCollection.find().sort({orderDate:-1})
     
     for(let i=0;i<orderdetail.length;i++)
     {
        const order = orderdetail[i]
        console.log('order is:',order );

        let finalPrice=0

        for(let j=0;j<order.productCollection.length;j++)
        {
            const product = order.productCollection[j]
            const productid = product.productid
            console.log('product is:', product);
            console.log('product id:', productid);

            let productData = await Product.findById(productid).select('price')
            console.log('product data is',productData);

            if(! productData)
            {
                console.log(`product with ${productid} is not found`);
                continue 
            }

            let orginalPrice  =productData.price
            console.log('orginal price is',orginalPrice);

            const productOfferInstance = await ProductOffer.findOne({productname:product.productname})
            console.log('productoffer instance is:',productOfferInstance);
            
            let discountAmount = 0
            if(productOfferInstance )
            {
                const discountPercentage = parseFloat(productOfferInstance.productoffer)
                discountAmount = (parseFloat(orginalPrice)*discountPercentage)/100
            }

            const categoryOffer = await CategoryOffer.findOne({category: product.Category})
            console.log('categoryOffer is :',categoryOffer);

            if(categoryOffer)
            {
                const discountPercentage = parseFloat(categoryOffer.alloffer)
                const categoryDiscountAmount = (parseFloat(orginalPrice )*discountPercentage)
                console.log(' discountPercentage is:', discountPercentage);
                console.log('categoryDiscountAmount is:',categoryDiscountAmount);

                if(categoryDiscountAmount> discountAmount)
                {
                       discountAmount=categoryDiscountAmount
                }

                const taxRate = 0.03
                const taxAmount = parseFloat(orginalPrice)*taxRate

                const productFinalPrice = (parseFloat(orginalPrice)*product.quantity)-discountAmount+taxAmount-(order.Discount||0)
                console.log('order discount is :',order.order.Discount);
                console.log('productfinal price is:',productFinalPrice);
                console.log('tax amount is:',taxAmount);
                console.log('discount amount is:',discountAmount);

                finalPrice +=productFinalPrice
                console.log('order finalprice',finalPrice);

                product.finalPrice =productFinalPrice
            }
            order.finalPrice = finalPrice
            await order.save()
            console.log('order saved with updated final price:',order);        
        }
     }
       res.render('orderManagement',{orderdetail})
  }
  catch(error)
  {
    console.log(error);
    res.status(500).send('Failure to render order page')
  }
}

const updateOrderPost = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status } = req.body;
    console.log('Update Request:', { orderId, productId, status });

    const order = await OrderCollection.findById(orderId);
    if (!order) {
      return res.status(404).send('Cannot find the order');
    }

    // Find the product inside the order
    const productInOrder = order.productCollection.find(p => p.productid.toString() === productId);

    if (!productInOrder) {
      return res.status(404).send('Product not found in order');
    }

    // Proceed with status update
    await OrderCollection.findOneAndUpdate(
      { _id: orderId, 'productCollection.productid': productId },
      { $set: { 'productCollection.$.status': status } },
      { new: true }
    );

    // Wallet refund logic
    if ((status === 'cancelled' || status === 'returned') &&
        productInOrder.status !== 'cancelled' && productInOrder.status !== 'returned') {

      const user = await UserCollection.findById(order.userid);
      if (user) {
        const refundAmount = productInOrder.price * productInOrder.quantity;
        user.wallet += refundAmount;
        await user.save();
        console.log(`Refunded ₹${refundAmount} to ${user.username}'s wallet`);
      }
    }

    res.redirect('/admin/orderManagement');
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports={
    adminLogin,
    adminLoginPost,
    dashboard,
    usermanagement,block,unblock,
    categoryManagement,addcategoryget,addCategoryPost,UnList,editCategoryget,editCategorypost,
    orderManagementGet,
    updateOrderPost
}