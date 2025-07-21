const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema(
    {
        coupencode:{type:String},
        discount:{type:Number},
        expiredate:{type:Date},
        purchaseamount:{type:Number}
    }
)

const Coupon = mongoose.model('coupon',couponSchema)
module.exports=Coupon