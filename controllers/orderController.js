const OrderCollection = require('../models/order')
const Cart= require('../models/cart')
const Product = require('../models/product')
const UserCollection = require('../models/user')
const Address = require('../models/address')
const Category = require('../models/category')
const CouponCollection = require('../models/coupon')
const ProductOffer = require('../models/productOffer')
const CategoryOffer = require('../models/categoryOffer')
const Wallet = require('../models/wallet')
const PDFDocument = require('pdfkit')

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.userid; // Make sure this matches your session setup
        console.log(`userid is ${userId}`);

        const errorMessage = req.session.checkoutError || null;
        req.session.checkoutError = null
        
        const checkout = await Cart.find({ userid: userId });
        const Tax_Rate = 0.03;
        let totalsum = 0;
        let totaltax = 0;
        let totalDiscount = 0;

        for (const item of checkout) {
            const product = await Product.findById(item.productId);
            console.log(`product is ${product}`);

            if (!product) {
                return res.status(404).send(`product with id ${item.productId}`);
            }

            const orginalPrice = item.price;
            console.log(`cart price is ${orginalPrice}`);
            console.log(`OrginalPrice is ${orginalPrice}`);
            let discountAmount = 0;
            
            // Retrieve product offer
            const productOfferInstance = await ProductOffer.findOne({ productname: product.name });
            if (productOfferInstance) {
                const discountPercentage = parseFloat(productOfferInstance.productoffer);
                discountAmount = (parseFloat(orginalPrice) * discountPercentage) / 100;
            }
            
            // Retrieve category offer
            const categoryOfferInstance = await CategoryOffer.findOne({ category: product.category.category });
            console.log(`categoryofferinstance is in get checkout ${categoryOfferInstance}`);
            if (categoryOfferInstance) {
                const discountPercentage = parseFloat(categoryOfferInstance.alloffer);
                const categoryDiscountAmount = (parseFloat(orginalPrice) * discountPercentage) / 100;
                if (categoryDiscountAmount > discountAmount) {
                    discountAmount = categoryDiscountAmount;
                }
            }
            
            const taxAmount = orginalPrice * item.quantity * Tax_Rate;
            const finalPrice = (orginalPrice * item.quantity) - discountAmount + taxAmount;

            totalsum += finalPrice;
            totaltax += taxAmount;
            totalDiscount += discountAmount;
            console.log(`totalsum is ${totalsum}`);
            console.log(`totaltax is ${totaltax}`);
            console.log(`totalDiscount is ${totalDiscount}`);
        }
        
        totalsum = parseFloat(totalsum.toFixed(2));
        totaltax = parseFloat(totaltax.toFixed(2));
        totalDiscount = parseFloat(totalDiscount.toFixed(2));

        const address = await Address.find({ userid: userId });
        console.log(`address is ${address}`);
        res.render('checkout', { checkout, address, totalsum, totaltax, totalDiscount,errorMessage });
    } catch (error) {
        console.log(error);
        res.status(500).send('error in product details');
    }
};

const checkoutPost= async(req,res)=>
{
    try
    {
      const{shippingOption,paymentMethod}= req.body
      console.log('req.body is :',req.body);
      const paymentmethod = req.body.paymentmethod || req.body.paymentMethod;
      
      const userId = req.session.userid
      const currentDate = new Date()

      const user = await UserCollection.findById( userId)
      if(!user)
      {
          req.session.checkoutError = 'User not found.';
          return res.redirect('/checkout');
      }

      const address = await Address.findById(shippingOption)
      if(! address)
       {
            req.session.checkoutError = 'Shipping address not found.';
            return res.redirect('/checkout');
       }
       const cartItem = await Cart.find({userid:userId})
       if(!cartItem.length)
       {
           req.session.checkoutError = 'Your cart is empty.';
           return res.redirect('/checkout');
       }
       console.log(`cart item is ${cartItem}`);

       let totalPrice =0
       cartItem.forEach((item)=>{
        totalPrice+=item.price * item.quantity
       })
       const orderProducts=[]

       for(const item of cartItem )
       { 
        console.log('processing productid:',item.productId);
        const product = await Product.findById(item.productId)
        if(!product)
        {
            console.log(`product not found:${item.productId}`);
            return res.status(404).send(`product with id ${item.productId} not found`)
        }
         // Reduce the stock
         product.stock -=item.quantity
         await product.save()

         orderProducts.push({
                    productid:item.productId,
                    productname:item.productname,
                    Category:item.Category,
                    price: item.price,
                    quantity:item.quantity,
                    productoffer: (item.productoffer)||0 * item.quantity,
                    image:item.image,
                    status:'pending'
         })
       }
       const couponcode = req.body.coupencode
       let discount = 0
       const coupon = await CouponCollection.findOne({coupencode:couponcode })
       if(coupon)
       {
          console.log(`coupon found ${coupon._id}`);
          discount=coupon.discount
       }
       else
       {
        console.log('coupon not found');
        
       }
       const  intDiscount= discount/orderProducts.length

       const order= new OrderCollection({
        userid:userId,
        Username:user.username,
        productCollection:orderProducts,
        addressCollection:{
            firstname:address.firstname,
            lastname:address.lastname,
            address:address.address,
            city : address.city,
            pincode:address.pincode,
            state : address.state,
            phone:address.phone,
            email:address.email
        },
        paymentMethod:paymentMethod,
         totalPrice:totalPrice,
          orderDate:currentDate,
          Discount:discount,
          intDiscount:intDiscount
       })
       await order.save()
       console.log('order saved successfully');
       await Cart.deleteMany({userid:userId})
       res.redirect('/placeOrder')
    }
    catch(error)
    {
        console.log(error);
        res.status(500).send('Error placing order')
    }
}

const addAddressCheckout = async(req,res)=>
{
    try
    {
      res.render('orderAddress')
    }
    catch(error)
    {
        console.log(error);
        res.status(404).send('cannot get the orderaddress')
        
    }
}

const addAddressCheckoutPost = async(req,res)=>
{
    try
    {
       const userId = req.session.userid
       console.log(`user id id ${userId}`);

       const address =
       {
       userid:req.session.userid,
       firstname:req.body.firstname,
       lastname:req.body.lastname,
       address:req.body.address,
       city :req.body.city,
       pincode:req.body.pincode,
       phone:req.body.phone,
       state:req.body.state,
       email:req.body.email
       }
       console.log(`body addres is success ${address }`);

       const newaddress = await Address.insertMany([address])
       console.log(`checkout address is ${ newaddress}`);
       res.redirect('/checkout')
    }
    catch(error)
    {
          console.log(error);
          res.sendStatus(400).status('cannot add checkout address')
    }
}
const placeOrder= async(req,res)=>
{
    try
    {
        res.render('placeOrder')
    }
    catch(error)
    {
        console.log(error);
        res.status(404).send('failed to place the order')
    }
}

const orderDetailsGet= async(req,res)=>
{
    console.log('entered into order details');
    try
    {
      const orderid = req.params.orderid
      const productid = req.params.productid

      console.log(`order id is ${orderid}`);
      console.log(`product id is ${productid}`);

      const order = await OrderCollection.findOne({_id:orderid,'productCollection.productid':productid})
      
      if(!order)
      {
        return res.status(404).send('order not found')
      }
      const product = order.productCollection.find((product)=>product.productid.toString()===productid)
      console.log('product is',product);
      console.log('product image is:', product.image);

      if(!product)
      {
        return res.status(404).send('Product not found in the order ')
      }
      const address = await Address.findOne({userid:order.userid})
      console.log('address is',address);

      const paymentStatus = order.paymentMethod === 'paid'?'paid':'unpaid'
      console.log('payment status is :',paymentStatus);
      
      let orginalPrice = await  Product.findById(productid).select('price') 
      orginalPrice=orginalPrice.price
      const pname = product.productname
      console.log('productname is',pname);

      const productOfferInstance = await ProductOffer.findOne({productname:pname})

      console.log('productOfferInstance is ',productOfferInstance );
      
      
      let discountAmount = 0
      if(productOfferInstance)
      {
        const discountPercentage = parseFloat(productOfferInstance.productoffer)
        discountAmount = (parseFloat(orginalPrice)*discountPercentage)/100
        console.log('discount percentage is :',discountPercentage);
        console.log('discount amount is ',   discountAmount);
      }

      const categoryOfferInstance = await CategoryOffer .findOne({category:product.Category})
      console.log('categoryOfferInstance is:',categoryOfferInstance);
      if(categoryOfferInstance )
      {
        const discountPercentage =parseFloat(categoryOfferInstance.alloffer)  
        const categoryDiscountAmount= (parseFloat(orginalPrice)*discountPercentage)/100

        if(categoryDiscountAmount>discountAmount)
        {
            discountAmount=categoryDiscountAmount
            console.log('discount amoount is ',discountAmount);
        }
      }
      const taxRate=0.03
      const taxAmount =(parseFloat(orginalPrice))* taxRate
       console.log('taxamount is:',taxAmount);
       const finalPrice= parseFloat(orginalPrice)-discountAmount+ taxAmount
       console.log('taxrate is',taxRate);
       console.log('final price is:',finalPrice);

       console.log('type of taxamount is:',typeof( taxAmount));
       console.log('type of orginal price is:',typeof(orginalPrice));

       res.render('orderDetails',{
        product,
        order,
        address,
        orderid,
        paymentStatus,
        orginalPrice,
        discountAmount:order.Discount,
        finalPrice:finalPrice.toFixed(2),
        taxAmount:taxAmount.toFixed(2)
       })
    }
    catch(error)
    {
         console.error(error)
         res.status(500).send('internal server error')
    }
}

const userOrders = async (req, res) => {
  try {
    const userid = req.session.userid;
    const orders = await OrderCollection.find({ userid: userid });

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log('order in show', order);

      for (let j = 0; j < order.productCollection.length; j++) {
        const product = order.productCollection[j];
        const productid = product.productid;

        const productObject = await Product.findById(productid).select('price');
        if (!productObject) {
          console.log(`warning: product not found for productid: ${productid}`);
          continue;
        }

        const orginalPrice = productObject.price;

        const productOfferInstance = await ProductOffer.findOne({ productname: product.productname });
        console.log(`product offer instance is ${productOfferInstance}`);

        let discountAmount = 0;
        if (productOfferInstance) {
          const discountPercentage = parseFloat(productOfferInstance.productoffer);
          discountAmount = (parseFloat(orginalPrice) * discountPercentage) / 100;
        }

        const categoryOfferInstance = await CategoryOffer.findOne({ category: product.Category });
        console.log(`category offer instance is ${categoryOfferInstance}`);

        if (categoryOfferInstance) {
          const discountPercentage = parseFloat(categoryOfferInstance.alloffer);
          const categoryDiscountAmount = (parseFloat(orginalPrice) * discountPercentage) / 100;

          if (categoryDiscountAmount > discountAmount) {
            discountAmount = categoryDiscountAmount;
          }
        }

        const taxRate = 0;
        const taxAmount = parseFloat(orginalPrice) * taxRate;

        const productFinalPrice = parseFloat(orginalPrice) - discountAmount + taxAmount;

        console.log(`product final price: ${productFinalPrice}, tax: ${taxAmount}, discount: ${discountAmount}`);

        product.finalPrice = productFinalPrice;
      }

      await order.save();
      console.log('order saved with updated final price', order);
    }

    res.render('userOrderDetails', { orders });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error rendering user orders');
  }
};

const cancelOrder = async(req,res)=>
{
  console.log('entered in to cancel order');
  
  try
  {
    const {orderId,productId} = req.params
    console.log(`${req.params}`);
    
    const Tax_Rate = 0.03

    const order = await OrderCollection.findById(orderId)
    if(!order)
    {
      return res.status(404).send(`order with id ${orderId} not found`)
    }
    const productIndex = order.productCollection.findIndex(
      (product)=>product.productid.toString()===productId
    )
    if(productIndex === -1)
    {
      return res.status(404).send(`product with id ${productId} not found in order`)
    }
    const cancelledProduct = order.productCollection[productIndex]
    console.log('cancelled product is :',cancelledProduct);
    

    let totalRefund = cancelledProduct.price *cancelledProduct.quantity
    console.log('total refund is',totalRefund);

    const taxAMount = totalRefund * Tax_Rate
    totalRefund += taxAMount
    console.log('tax amount is:',taxAMount);
    console.log('tax rate is :',Tax_Rate);

    if(order.Discount > 0)
    {
      totalRefund -= order.Discount
    }
    console.log('total refund is', totalRefund);
    
    if(order.paymentMethod === 'Net Banking')
    {
      const user = await UserCollection.findById(order.userid)
      user.wallet +=totalRefund
      await user.save()

      await Wallet.create({
         userid: order.userid,
         date: new Date(),
         amount :totalRefund,
         creditordebit:'credit'

      })

      console.log('wallet is ',Wallet);
      
      console.log('refund processed successfully', totalRefund);
      
    }
    cancelledProduct.status ='cancelled'
    await order.save()
    res.redirect('/userOrderDetails')
  }
  catch(error)
  {
     console.log(error);
     res.status(500).send('internal server error')
     
  }
}

const orderReturn = async (req, res) => {
  console.log('Entered in product return');
  try {
    const orderId = req.params.userId; // Should be the order ID, rename accordingly if needed
    const productId = req.params.productId;
    const selectedStatus = 'returned';
    const userSessionId = req.session.userid;

    console.log(`Order ID is: ${orderId}`);
    console.log(`Product ID is: ${productId}`);
    console.log(`User session ID is: ${userSessionId}`);

    const TAX_RATE = 0.03;

    // Fetch the order that contains the product
    const order = await OrderCollection.findOne({
      _id: orderId,
      'productCollection.productid': productId
    });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const product = order.productCollection.find(
      (product) => product.productid.toString() === productId
    );

    if (!product) {
      return res.status(404).send('Product not found in the order');
    }

    const { price, quantity, productoffer = 0 } = product;

    console.log('Price:', price);
    console.log('Quantity:', quantity);
    console.log('Product Offer:', productoffer);

    // Calculate refund
    const offerPerUnit = productoffer / quantity;
    const pricePerUnitWithOffer = price + offerPerUnit;
    const grossRefund = pricePerUnitWithOffer * quantity;

    let totalRefund = grossRefund - productoffer;

    if (order.Discount && order.Discount > 0) {
      totalRefund -= order.Discount;
      console.log('Discount applied:', order.Discount);
    }

    // Update product status inside the productCollection array
    await OrderCollection.updateOne(
      { _id: orderId, 'productCollection.productid': productId },
      { $set: { 'productCollection.$.status': selectedStatus } }
    );

    // Increment stock back to Product
    await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: { stock: quantity } }
    );

    // If payment method is eligible for refund
    if (
      order.paymentMethod === 'Net Banking' ||
      order.paymentMethod === 'Cash on Delivery'
    ) {
      console.log('paymentmethod:',order.paymentMethod);
      
      const taxAmount = totalRefund * TAX_RATE;
      totalRefund += taxAmount;

      console.log('Tax amount:', taxAmount);
      console.log('Total refund including tax:', totalRefund);

      const user = await UserCollection.findOneAndUpdate(
        { _id: userSessionId },
        { $inc: { wallet: totalRefund } }
      );

      console.log('Updated user:', user);

      // Create wallet transaction record
      await Wallet.create({
        userid: userSessionId,
        date: new Date(),
        amount: totalRefund,
        creditordebit: 'credit'
      });
    }

    // Update local product status and save
    product.status = selectedStatus;
    await order.save();

    console.log('Product status updated to:', product.status);
    res.redirect('/userOrderDetails');
  } catch (error) {
    console.error('Error in orderReturn:', error);
    res.status(500).json({ success: false, message: 'Error returning order' });
  }
};

const Invoice = async (req, res) => {
  try {
    let userId = req.session.userid;
    const orderId = req.params.orderid;

    const invoiceDetails = await UserCollection.findOne({ _id: userId });
    const specificOrder = await OrderCollection.findById(orderId);

    if (!specificOrder) {
      return res.status(404).render('error', { message: 'Order not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

    doc.pipe(res);

    // Colors
    const primaryColor = '#f74f10';
    const secondaryColor = '#333333';
    const lightColor = '#777777';
    const borderColor = '#dddddd';

    // Logo
    const imagePath = 'public/images/logo.png';
    doc.image(imagePath, 50, 45, { width: 100 });

    // Invoice header
    doc.fillColor(secondaryColor)
       .fontSize(20)
       .text('INVOICE', 200, 50, { align: 'right' });

    doc.fillColor(lightColor)
       .fontSize(10)
       .text(`Invoice #${orderId.substring(0, 8)}`, 200, 75, { align: 'right' })
       .text(`Date: ${new Date().toLocaleDateString()}`, 200, 90, { align: 'right' });

    // Horizontal line
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .strokeColor(borderColor)
       .stroke();

    // Billing Information
    doc.fillColor(primaryColor)
       .fontSize(14)
       .text('BILL TO:', 50, 140);

    doc.fillColor(secondaryColor)
       .fontSize(12)
       .text(invoiceDetails.username || '', 50, 160)
       .text(invoiceDetails.email || '', 50, 175);

    if (specificOrder.addressCollection) {
      const address = specificOrder.addressCollection;
      doc.text(`${address.address}, ${address.city}`, 50, 190)
         .text(`${address.state}, ${address.pincode || ''}`, 50, 205);
    }

    // Payment method
    doc.fillColor(primaryColor)
       .fontSize(14)
       .text('PAYMENT METHOD:', 300, 140);

    doc.fillColor(secondaryColor)
       .fontSize(12)
       .text(specificOrder.paymentMethod || '', 300, 160);

    // Order summary header
    doc.fillColor(primaryColor)
       .fontSize(14)
       .text('ORDER SUMMARY', 50, 250);

    // Table header
    const tableTop = 280;
    const itemCodeX = 50;
    const descriptionX = 150;
    const statusX = 350;
    const quantityX = 420;
    const priceX = 480;

    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(secondaryColor)
       .text('Item', itemCodeX, tableTop)
       .text('Description', descriptionX, tableTop)
       .text('Status', statusX, tableTop)
       .text('Qty', quantityX, tableTop)
       .text('Price', priceX, tableTop);

    // Horizontal line under header
    doc.moveTo(50, tableTop + 20)
       .lineTo(550, tableTop + 20)
       .strokeColor(borderColor)
       .stroke();

    // Table rows
    let currentY = tableTop + 30;
    specificOrder.productCollection.forEach((product, index) => {
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(secondaryColor)
         .text(index + 1, itemCodeX, currentY)
         .text(product.productname || '', descriptionX, currentY, { width: 180 })
         .text(product.status || '', statusX, currentY)
         .text(product.quantity || '', quantityX, currentY)
         .text(`₹${product.price || ''}`, priceX, currentY);

      currentY += 20;
      
      // Add small gap between items
      if (index < specificOrder.productCollection.length - 1) {
        currentY += 10;
      }
    });

    // Horizontal line above total
    doc.moveTo(50, currentY + 10)
       .lineTo(550, currentY + 10)
       .strokeColor(borderColor)
       .stroke();

    // Total
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(secondaryColor)
       .text('Subtotal:', priceX - 100, currentY + 20, { width: 100, align: 'right' })
       .text(`₹${specificOrder.totalPrice || ''}`, priceX, currentY + 20);

    // Coupon discount if exists
    if (specificOrder.Discount && specificOrder.Discount > 0) {
      doc.text('Discount:', priceX - 100, currentY + 40, { width: 100, align: 'right' })
         .text(`-₹${specificOrder.Discount}`, priceX, currentY + 40);
    }

    // Tax if exists
    if (specificOrder.taxAmount && specificOrder.taxAmount > 0) {
      doc.text('Tax:', priceX - 100, currentY + 60, { width: 100, align: 'right' })
         .text(`+₹${specificOrder.taxAmount}`, priceX, currentY + 60);
    }

    // Grand total
    doc.fontSize(14)
       .fillColor(primaryColor)
       .text('Total:', priceX - 100, currentY + 90, { width: 100, align: 'right' })
       .text(`₹${specificOrder.totalPrice || ''}`, priceX, currentY + 90);

    // Footer
    const footerY = 750;
    doc.fontSize(10)
       .fillColor(lightColor)
       .text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 })
       .text('RED STORE - 1345 Market st, suite 500, Kollam, KL 691501', 50, footerY + 20, { align: 'center', width: 500 })
       .text('Phone: (+91) 9645342887 | Email: info@redstore.com', 50, footerY + 40, { align: 'center', width: 500 });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generating invoice' });
  }
};



module.exports=
{
   getCheckout,
   addAddressCheckout,
   addAddressCheckoutPost,
   checkoutPost,
   placeOrder,
   orderDetailsGet,
   userOrders,
   cancelOrder,
   orderReturn,
   Invoice 
}