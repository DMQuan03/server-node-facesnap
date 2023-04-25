const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var CommentSchema = new mongoose.Schema({
    text:{
        type:String,
        required:true,
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref : "User",
        required:true,    
    },
    likes : {type : Number , default : 0},
    disLikes : {type : Number , default : 0},
    userLikes : [
        {
            user : {
                type : mongoose.Types.ObjectId,
                ref : "User"
            }
        }
    ],
    userDisLikes : [
        {
            user : {
                type : mongoose.Types.ObjectId,
                ref : "User"
            }
        }
    ],
    reply : [
        {
            user : {
                type : mongoose.Types.ObjectId,
                ref : "User"
            },
            comment : {
                type : mongoose.Types.ObjectId,
                ref : "Comment"
            }
        }
    ],
    idPOST : {
        type : String,
        required : true
    }
},
    {timestamps : true}
);

//Export the model
module.exports = mongoose.model('Comment', CommentSchema);