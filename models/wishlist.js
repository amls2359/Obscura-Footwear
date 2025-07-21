
const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
    userid:{
           type: mongoose.Schema.Types.ObjectId,
           ref:'User'
    },
    user:
    {
        type:String
    },
    productid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
},
    product:
    {
        type: String
    },
    price:
    {
        type : Number
    },
    image:
    {
        type: String
    },
    category:
    {
        type : String
    }

})

const wishlist = mongoose.model('wishlist',wishlistSchema)
module.exports= wishlist