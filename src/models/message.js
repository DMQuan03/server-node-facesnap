const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var chatSchema = new mongoose.Schema({
    text:{
        type:String,
        required:true,
    },
    userId:{
        type : mongoose.Types.ObjectId,
        ref : "User",
        required : true
    },
    idRoom : {
        type : String,
        required : true
    }
}, 
    {timestamps : true}
);

//Export the model
module.exports = mongoose.model('Chat', chatSchema);