const Razorpay = require('razorpay')
require('dotenv').config()

const orderPayment = async(req,res)=>
{
    try
    {
        console.log('online payment process started');
        const{amount}=req.body

        const amountInPaise = Math.round(Number(amount)*100)
        if(isNaN(amountInPaise) || amountInPaise<=0)
        {
            return res.status(400),json({
                error:'Invalid amount provided',
                message:'Amount mus be a positive number'
            })
        }
        console.log(`converted amount in paise ${amountInPaise}`);

        var instance = new Razorpay({
            key_id:process.env.KEY_ID,
            key_secret:process.env.KEY_SECRET
        })

        var options=
        {
            amount:amountInPaise,
            currency : 'INR',
            receipt:`order_rcptid'_${Date.now()}`
        }
        instance.orders.create(options,function(err,order){
            if(err)
            {
                console.error('Razorpay order creation error',err)
                return res.status(500).json({
                    error:'Payment gateway error',
                    details:err.error.description||err.message
                })
            }
            console.log('Order created successfully:',order.id);
            res.json({
                success:true,
                orderId:order.id,
                amount:amountInPaise,
                currency:options.currency
            })
        })
    }
    catch(error)
    {
      console.error('Unexpected error',error)
      res.status(500).json({
        error:'internal server error',
        message:error.message
      })
    }
}

const paymentFailed =(req,res)=>
{
    try
    {
        res.render('paymentFailed')
    }
    catch(error)
    {
        console.error('payment failed page error:',error);
        res.status(500).send('Error loading payment failed page')
        
    }
}

module.exports=
{
    orderPayment,
    paymentFailed
}