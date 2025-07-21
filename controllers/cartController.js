const express=require('express')
const Cart=require('../models/cart')
const Product=require('../models/product')
const Category=require('../models/category')
const UserCollection=require('../models/user')

const getcart=async(req,res)=>{
    try
    {
          const sessionId=req.session.userid
          console.log('session id is',sessionId);
          
          const cartfind= await Cart.find({userid: sessionId})
            console.log('cart find is',cartfind);
            
          if(!sessionId)
          {
            return res.status(400).send('Session not found')
          }
          let overallTotalSum=0
          cartfind.forEach((cartItem)=>{
            const itemTotal=cartItem.price* cartItem.quantity
            overallTotalSum+=itemTotal
          })
          const cartItems= await Cart.find({userid:sessionId})
          console.log('cart items:',cartItems);
          
          res.render('cart',{cartfind,cartItems,overallTotalSum})
    }
    catch(error)
      {
         console.log(error);
         res.status(500).send('server error11')
         
      }
}

const addToCart = async (req, res) => {
    try {
        console.log('Add to cart initiated');
        const productId = req.params.productId;
        const userId = req.session.userId || req.session.userid || req.session.user._id;

        console.log('Product ID:', productId);

        if (!userId) {
            console.log('No user ID - redirecting to login');
            return res.redirect('/UserLogin');
        }

        const product = await Product.findById(productId).populate('category');
        
        if (!product) {
            console.log('Product not found');
            return res.status(404).send('Product not found');
        }

        console.log('Product found:', product.productname);

        let cartItem = await Cart.findOne({ 
            productId: productId,
            userid: userId
        });

        if (cartItem) {
            console.log('Existing cart item found, increasing quantity');
            cartItem.quantity += 1;
        } else {
            console.log('Creating new cart item');
            cartItem = new Cart({
                userid: userId,
                productId: productId,
                productname: product.productname,
                Category: product.category.category,
                quantity: 1,
                image: product.image,
                price: product.price
            });
        }

        await cartItem.save();
        console.log('Cart item saved successfully');
        res.redirect('/cart');
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send('Internal Server Error');
    }
};


const updateQuantity = async (req, res) => {
    try {
         const  action  = req.body.action;
        const productId = req.params.productid;
       
        
        // Find the cart item by its ID
        const cartItem = await Cart.findById(productId);
        
        if (!cartItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Cart item not found' 
            });
        }

        // Get the product details
        const product = await Product.findById(cartItem.productId);
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found' 
            });
        }

        const maxQuantity = product.stock;
        let newQuantity = cartItem.quantity;
        
        if (action === 'increase') {
            if (cartItem.quantity < maxQuantity) {
                newQuantity = cartItem.quantity + 1;
            } else {
                return res.status(400).json({ 
                    success: false,
                    error: 'Maximum quantity reached' 
                });
            }
        } else if (action === 'decrease') {
            if (cartItem.quantity > 1) {
                newQuantity = cartItem.quantity - 1;
            } else {
                return res.status(400).json({ 
                    success: false,
                    error: 'Minimum quantity is 1' 
                });
            }
        }

        // Update the quantity
        cartItem.quantity = newQuantity;
        await cartItem.save();

        // Calculate the updated item total
        const itemTotal = cartItem.price * newQuantity;

        // Get all cart items to calculate subtotal
        const allCartItems = await Cart.find({ userId: cartItem.userId });
        let subTotal = 0;
        
        allCartItems.forEach((item) => {
            subTotal += item.price * item.quantity;
        });

        res.status(200).json({
            success: true,
            updatedCartItem: {
                _id: cartItem._id,
                productId: cartItem.productId,
                price: cartItem.price,
                quantity: newQuantity,
                itemTotal: itemTotal
            },
            subTotal,
            total: subTotal
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
}

const removeCartItem= async(req,res)=>{
    const pid=req.params.productid
    console.log('product id is :',pid);

    const removecart= await Cart.findByIdAndDelete(pid)
    .then(x=>{
        console.log('deleted',x);
        res.redirect('/cart')
    })
    .catch(x=>{
        console.log('error in deletion');
        res.redirect('/Homepage')
        
    })
}


module.exports=
{
  getcart,
  addToCart,
  updateQuantity,
  removeCartItem
}