const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var VideoSchema = new mongoose.Schema({
    title:{ // done //
        type:String,
        required:true,
    },
    userId:{ // done //
        type:mongoose.Types.ObjectId,
        ref : "User",
        required:true,
    },
    comment:[
        {
            type:mongoose.Types.ObjectId,
            ref : "Comment"
        }
    ],
    likes : { // done //
        type : Number,
        default : 0
    },
    disLikes : { // done //
        type : Number,
        default : 0
    },
    shares : { // done //
        type : Number,
        default : 0
    },
    userLikes : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    userDisLikes : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    userShares : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    views : {
        type : Number,
        default : 0
    },
    img : { // done //
        type : String,
    },
    video : {
        type : String,
        required : true
    },
    
},
    {timestamps : true}
);

//Export the model
module.exports = mongoose.model('Video', VideoSchema);