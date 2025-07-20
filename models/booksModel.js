const mongoose = require('mongoose');
const slugify = require("slugify");


const bookSchema = mongoose.Schema({
    title :{
        type: String,
        required: true 
    },
    category :{
        _id: { type: String },
        name: { type: String }
    },
    author:{
         type: String
    },
      authorDescription: {
    type: String
  },

    price:{
        type: Number,
        required: true,
        min: 0
    },
    description:{
         type: String
    },
    stock:{
    ar: { type: Number, default: 0 },
    en: { type: Number, default: 0 },
    fr: { type: Number, default: 0 },
    },
    image:{
        type:String
    },
     slug: {
    type: String,
    unique: true
  },
    reviews:[{
type: mongoose.Schema.Types.ObjectId,
ref:'Review'
    }],

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true 
 }

    
}, { timestamps: true });


bookSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true });
  }
  next();
});


const Book = mongoose.model("Book", bookSchema);
module.exports = Book;