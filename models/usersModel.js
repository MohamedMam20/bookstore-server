const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
});

const paymentMethodSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Visa', 'Mastercard', 'PayPal', 'Other'],
        default: 'Visa'
    },
    cardNumber: String,
    expiryDate: String,
    cardHolder: String,
    isDefault: {
        type: Boolean,
        default: false
    }
});

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password:{
        type: String,
        required: function () {
            return !this.isGoogleUser;
        }
    },
    role:{
        type: String,
        enum: ['user','admin','guest'],
        default: 'user'
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String
    },
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    paymentMethods: [paymentMethodSchema]
},{timestamps:true});

const User = mongoose.model("User",userSchema);

module.exports = User;