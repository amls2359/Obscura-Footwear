
const Product=require('../models/product')
const UserCollection =require('../models/user')
const Category=require('../models/category')
const CategoryOffer = require('../models/categoryOffer')
const ProductOffer = require('../models/productOffer')
const OrderCollection = require('../models/order')


const adminLogin=(req,res)=>res.render('adminLogin')


const dashboard = async (req, res) => {
    console.log('entered into dashboard');

    if (req.session.admin) {
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

  

//adminlogin post
const adminloginpost = async (req, res) => {
    try {
        console.log('entered into admin login');
        
        const admin = {
            username: "admin",
            password: "12345"
        };
        if (req.body.username === admin.username && req.body.password === admin.password) {
            req.session.admin=admin.username;
            res.redirect("/admin/dashboard"); 
        } else {
            return res.render('adminLogin', { 
                errorMessage: 'Invalid username or password', 
                successMessage: null 
            });
        }
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const usermanagement = async (req, res) => {
    try {
        const searchQuery = req.query.search || ''; // Get search query from URL

        // Build the query object
        const query = {};

        if (searchQuery) {
            query.$or = [
                { username: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive username search
                { email: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive email search
            ];
        }

        // Fetch users based on the query
        const userdata = await UserCollection.find(query);

        // Render the view with user data and search query
        res.render('usermanagement', { userdata, searchQuery });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error");
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

const updateOrderPost = async(req,res)=>
{
    try
    {
      const {orderId,productId} = req.params
      const{status}= req.body
      console.log(orderId,productId,status);

      const orders = await OrderCollection.findById(orderId)
      if(!orders)
       {
        return res.status(404).send('cannot find the product')
       }
       await OrderCollection.findOneAndUpdate({_id:orderId,'productCollection.productid':productId},{$set:{'productCollection.$.status':status}},{new:true})
       .then((success)=>{
        console.log('updated',success);
        res.redirect('/admin/orderManagement')
       })
       .catch((err)=>{
        console.log('error',err);
        res.status(500).send('Internal server error')
       })
    }
    catch(error)
    {
      console.log(error);
      res.status(500).send('Internal server error')
      
    }
}

module.exports={
    adminLogin,
    adminloginpost,
    dashboard,
    usermanagement,block,unblock,
    categoryManagement,addcategoryget,addCategoryPost,UnList,editCategoryget,editCategorypost,
    orderManagementGet,
    updateOrderPost



}