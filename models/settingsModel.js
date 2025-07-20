const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
  siteName: {
    type: String,
    default: 'BookShelf'
  },
  logo: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: 'contact@bookshelf.com'
  },
  supportPhone: {
    type: String,
    default: '+1 (123) 456-7890'
  },
  address: {
    type: String,
    default: '123 Book Street, Library City, 10001'
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  shippingOptions: [{
    name: { type: String },
    price: { type: Number },
    estimatedDays: { type: String }
  }],
  paymentGateways: {
    paypal: { type: Boolean, default: true },
    stripe: { type: Boolean, default: false },
    cod: { type: Boolean, default: true }
  },
  emailNotifications: {
    newOrder: { type: Boolean, default: true },
    orderStatusChange: { type: Boolean, default: true },
    newUser: { type: Boolean, default: true },
    newReview: { type: Boolean, default: true }
  },
  maintenance: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'Site is under maintenance. Please check back later.' }
  }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  return this.create({});
};

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;