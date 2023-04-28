const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    prices:{
        type:Number,
        default : 0
    },
    quantity : {
        type : Number,
        default : 1,
    },
    img : {
        type : String,
        required : true
    },
    star : {
        type : Number,
        default : 5
    },
    userId : {
        type : mongoose.Types.ObjectId,
        ref : "User",
        required : true
    },
    brand : {
        type : String,
    },
    shopAddress : {
        type : "String",
        required : true
    },
    status : {
        type : String,
        default : "still"
    },
    views : {
        type : Number,
        default : 0,
    },
    comment : [
        {
            type : mongoose.Types.ObjectId,
            ref : "Comment"
        }
    ]
});

//Export the model
module.exports = mongoose.model('Product', productSchema);