const mongoose=require('mongoose')
const {ObjectId}=require('mongodb')

const cartSchema=new mongoose.Schema({
    userid:{
      type: ObjectId 
    },
    username:
    {
       type:String
    },
    productId:{
        type:ObjectId
    },
    productname:{
        type:String
    },
    productoffer:
    {
        type:Number,
    },
    Category:
    {
        type:String
    },
    price:
    {
        type:Number
    },
    quantity:
    {
        type:Number
    },
    image:[String]
})

const Cart= mongoose.model('Cart',cartSchema)
module.exports=Cart