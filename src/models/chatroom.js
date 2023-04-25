const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var RoomChatSchema = new mongoose.Schema({
    nameRoom:{
        type:String,
    }, // done //
    user1 : {
        type : mongoose.Types.ObjectId,
        ref : "User"
    }, // done //
    user2 : {
        type : mongoose.Types.ObjectId,
        ref : "User"
    }, // done //
    members:[
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ], // done //
    messages:[
        {
            type : mongoose.Types.ObjectId,
            ref : "Chat"
        }
    ], // done //
    createBy : [
        {
            type : String,
            required : true
        }
    ], // done //
    admin : [
        {
            type : mongoose.Types.ObjectId,
            ref : "User",
            required : true
        }
    ], // done //
    listImg : [
        {
            type : mongoose.Types.ObjectId,
            ref : "ImgMessage"
        }
    ],
    blockUser : [
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ], // done //
    blockChat : [
        {
            type : mongoose.Types.ObjectId,
            ref : "User"   
        }
    ], // done //
    themes : {
        type : String,
        default : "https://wall.vn/wp-content/uploads/2020/03/hinh-nen-dep-may-tinh-86.jpg"
    }, // done //
    idCheck1 : {
        type : "String",
        required : true,
    }, // done //
    idCheck2 : {
        type : "String",
        required : true,
    }, // done //
    avatarRoom : {
        type : String,
    }, // done
    description : {
        type : String,
        default : "only"
    } // done
});

//Export the model
module.exports = mongoose.model('RoomChat', RoomChatSchema);