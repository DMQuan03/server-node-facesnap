const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const User = new mongoose.Schema({
    email:{ //done//
        type:String,
        required:true,
        unique:true,
        maxLength : 30,
        minLength : 13
    },
    password:{ //done//
        type:String,
        required:true,
        minLength : 6,
    },
    phone:{ //done//
        type:Number,
        required:true,
        unique:true,
        minLength : 10,
        maxLength : 11
    },
    firstName:{ // done//
        type:String,
        required:true,
    },
    lastName:{ //done//
        type:String,
        required:true,
    },
    fullName:{//done//
        type:String,
        required : true,
        maxLength : 20,
        minLength : 2
    },
    age:{ //done//
        type:Number,
        default : 10
    },
    friends: [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    followingOfUser : {type : Number , default : 0},
    following :  [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    address :  {type : Object, default : { // done //
        country : "VN",
        home : "GIA LOC",
        from : "HAI DUONG"
    }},
    blog : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "Blog"
        }
    ],
    avatar : { // done //
        type : String,
        default : "https://tse3.mm.bing.net/th?id=OIP.17_SWxBNo9THUtD8M_n-ZwAAAA&pid=Api&P=0"
    },
    videos : [
        {
            type : mongoose.Types.ObjectId,
            ref : "Video"
        }
    ],
    family :  [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    role : { // done //
        type : String,
        default : "User"
    },
    isBlock : { // done //
        type : Boolean,
        default : false
    },
    block : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ] ,
    otherBlock : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    tick : { // done //
        type : Boolean,
        default : false
    },
    otherFollowing : [ // done //
        {type : mongoose.Types.ObjectId,
        ref : "User"
        }
    ],
    // isActive : {
    //     type : Boolean,
    //     default : false
    // },
    isActive : {
        type : Boolean,
        default : false
    },
    birthDay : {
        type : Date,
        default : Date.now()
    },
    listAwait : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    addFriends : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }
    ],
    shares : [ // done //
        {
            type : mongoose.Types.ObjectId,
            ref : "Blog"
        }
    ],
    sorts : {
        type : Number,
        default : 0
    },
    roomChats : [
        {
            type : mongoose.Types.ObjectId,
            ref : "RoomChat"
        }
    ],
    cart : [
        {
            idProduct : {
                type : mongoose.Types.ObjectId,
                ref : "Product"
            },
            status :{ type : String,
            default : "pending"},
            quantity : {
                type : Number,
                default : 1,
                required : true
            },
        }
    ],
    coins : {
        type : Number,
        default : 0
    }

},
    {timestamps : true}
);

//Export the model
module.exports = mongoose.model('User', User);