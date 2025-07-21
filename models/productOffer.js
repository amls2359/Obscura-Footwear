const mongoose=require('mongoose')

const productOfferSchema = new mongoose.Schema({
    productname:{type:String},
    price:{type:Number},
    productoffer:{type:Number}
})

const productOffer = mongoose.model('productoffer',productOfferSchema)

module.exports= productOffer
