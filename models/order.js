const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    userid: {
      type: String
    },
    Username: {
      type: String
    },
    productCollection: [
      {
        productid: {
          type: ObjectId
        },
        productname: {
          type: String,
          required: true,
        },
        Category: {
          type: String
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        productoffer: {
          type: Number,
          required: true,
        },
        image: {
          type: [String]
        },
        status: {
          type: String
        },
        finalPrice: {
          type: String,
          default: 0,
        },
      },
    ],
    addressCollection: {
      firstname: {
        type: String,
      },
      lastname: {
        type: String,
      },
      city: {
        type: String,
      },
      address: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      state: {
        type: String,
      },
      phone: {
        type: Number,
      },
      email: {
        type: String,
      },
    },
    paymentMethod: {
      type: String,
    },
    totalPrice: {
      type: Number,
    },
    orderDate: {
      type: Date,
    },
    Discount: {
      type: Number,
    },
    intDiscount: {
      type: Number,
    },
  }
);

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;