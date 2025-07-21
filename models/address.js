const mongoose = require('mongoose')
const {ObjectId}= require('mongodb')

const addressSchema = new mongoose.Schema(
    {
       userid:{type:ObjectId},
       firstname:{type:String},
       lastname:{type:String},
       address:{type:String},
       city :{type:String},
       pincode:{type:Number},
       phone:{type:Number},
       state:{type:String},
       email:{type:String}

    }
)

const addressStructure = mongoose.model('address',addressSchema)
module.exports=addressStructure