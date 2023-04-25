const User = require("../models/user")
const Blog = require("../models/blog")
const Video = require("../models/video")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const UserControllers = {
    registerUser : async(req , res) => {
        try {
            const { email , password, firstName , lastName } = req.body
            if (!email || !password) return res.status(404).json({
                message : "You must enter full fields"
            })
            if (!firstName) req.body.firstName = email.slice(0, 1).toString()
            if (!lastName) req.body.lastName = email.slice(1 , email.length - 1).toString()
            if (!req.body.fullName) req.body.fullName = req.body.email.slice(0,  10)
            const salt = await bcrypt.genSalt(10)
            const hashed = await bcrypt.hash(password, salt)
            req.body.password = hashed
            const listAcc = await User.findOne({email})
            if (listAcc !== null) return res.status(300).json({
                message : "user already exits",
                success : false
            })
            const newUser = await User.create(req.body)
            await newUser.save()
            const { email : a, fullName , ...rest } = newUser
            return res.status(200).json({
                success : true,
                message : "register successfully",
                data : {
                    email: a,
                    fullName
                }
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success : false,
                code : 500,
                message : "register fail"
            })
        }
    },

    loginUser : async(req , res) => {
        try {
            const { email , password } = req.body
            const user = await User.findOne({ email })
            if (!user) return res.status(404).json({
                message : "wrong email",
                success : false
            })
            if (typeof password !== "string") return res.status(404).json("wrong password")
            const isPassword = await bcrypt.compare(
                password,
                user.password
            )
            if (!isPassword) return res.status(200).json({
                message : "wrong password",
                success : false
            })
            if (user && isPassword) {
                const accessToken = jwt.sign({
                    _id : user._id,
                    role : user.role,
                    avatar : user.avatar,
                    fullName : user.fullName
                },
                    process.env.ACCESS_TOKEN,
                    {expiresIn : "1d"}
                )
                const refreshToken = jwt.sign({
                    _id : user._id,
                    role : user.role
                },
                    process.env.REFRESH_TOKEN,
                    {expiresIn : "7d"}
                )
                const { password , ...other } = user._doc
                return res.status(200).json({
                    success : true,
                    data : {
                        ...other,
                        accessToken
                    }
                })                
            }
        } catch (error) {
            return res.status(500).json({
                message : "ERROR",
                success : false
            })
        }
    },

    getOnlyUser : async(req , res) => {
        try {
            const { _id } = req.params
            if (!_id) return res.status(403).json({
                message : "not Found"
            })
            const userOnly = await User.findOne({_id}).populate("friends", "fullName avatar")
            .populate("blog", "title")
            .populate("shares")
            const blog = await userOnly.populate("blog")
            const share = await userOnly.populate("shares")
            for (let i in blog.blog) {
               await blog.blog[i].populate("userId", "_id fullName avatar")
            }
            for (let i in share.shares) {
                await share.shares[i].populate("userId", "_id fullName avatar")
             }
            const { password , phone , isBlock, otherBlock, lastName , firstName, roomChats, addFriends, ...rest } = userOnly._doc
            return res.status(200).json({
                success : true,
                data : {...rest},
            })
        } catch (error) {
            return res.status(200).json({
                success : false,
                message : "fail"
            })
        }
    },

    getAllUser : async(req , res) => {
        try {
            if (req.user.role !== "admin" || req.user.role === null 
            || req.user.role === undefined ||req.user.role === "" 
            ||req.user.role === true ||req.user.role === false) return res.status(403).json({
                message : "you cant admin"
            })
            const user = await User.find().select("-password")
            return res.status(200).json({
                success : true,
                    user
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message : "error from server",
                success : false
            })
        }
    },

    getCurrentUser : async(req , res) => {
        try {
            const user = await User.findOne({_id : req.user._id}).select("-password -isBlock")
            .populate("friends" , "avatar fullName isActive _id sorts")
            .populate("roomChats")
            .populate("listAwait", "avatar fullName _id createdAt")
            const lengthRooms = user.roomChats.length
            for  (let i = 0 ; i < lengthRooms; i ++) {
                await (user.roomChats[i]).populate("user1", "fullName avatar _id")
                await (user.roomChats[i]).populate("user2", "fullName avatar _id")
                await (user.roomChats[i]).populate("members", "avatar _id fullName")
            }
            for  (let i = 0 ; i < lengthRooms; i ++) {
                await user.roomChats[i].populate("messages")
            }
            for  (let i = 0 ; i < lengthRooms; i ++) {
                for (let j = 0 ; j < user.roomChats[i].messages.length; j ++) {
                    await user.roomChats[i].messages[j].populate("userId", "fullName avatar")
                } 
            }
            return res.status(200).json({
                success : true,
                user,
            })
            
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    },



    deleteUser : async(req , res) => {
        try {
            const {_id} = req.params
            const dlt = await User.deleteOne({_id : _id})
            return res.status(200).json({
                success : true,
                message : "deleted User",
                dlt
            })
        } catch (error) {
            return res.status(500).json({
                success : false,
                message : error.message
            })
        }
    },

    adminBlock : async(req , res) => {
        try {
            const {_id} = req.params
            await User.updateOne({ _id }, { $set : { isBlock : true} } )
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    AddAdmin : async(req , res) => {
        try {
            const {_id} = req.params
            await User.updateOne({ _id }, { $set : { role : "admin"} } )
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    deleteAdmin : async(req , res) => {
        try {
            const {_id} = req.params
            await User.updateOne({ _id }, { $set : { role : "user"} } )
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    setTickUser : async(req , res) => {
        try {
            const {_id} = req.params
            await User.updateOne({ _id }, { $set : { tick : true} } )
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    deleteTick : async(req , res) => {
        try {
            const {_id} = req.params
            await User.updateOne({ _id }, { $set : { tick : false} } )
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    updateUser : async(req , res) => {
        try {
            const { fullName , phone , age , avatar } = req.body
            const user = await User.findOne({_id : req.user._id})
            if (!fullName) req.body.fullName = user.fullName
            if (!phone) req.body.phone = Math.floor(user.phone)
            if (!age) req.body.age = Math.floor(user.age)
            if (!avatar) req.body.avatar = user.avatar
            const user1 = await User.findByIdAndUpdate({ _id : req.user._id }, req.body , {new : true})
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            console.log(error);
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    BlockUser : async(req , res) => {
        try {
            const {_id} = req.params
            if (!_id) throw new Error("fai")
            const user = await User.findOne({_id : req.user._id})
            if (!user.block.includes(_id)) {
                await User.updateOne({_id : req.user._id}, { $addToSet : { block : _id } })
                await User.updateOne({_id : _id}, { $addToSet : { otherBlock : req.user._id } })
            }else {
                await User.updateOne({_id : req.user._id}, { $pull : { block : _id } })
                await User.updateOne({_id : _id}, { $pull : { otherBlock : req.user._id } })
            }
            return res.status(200).json({
                message : "success",
                success : true
            })
        } catch (error) {
            return res.status(200).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    followingUser : async(req , res) => {
        try {
            const {_id} = req.params
            if (!_id) return res.status(404).json({
                message : "Not Found",
                success : true
            })
            // const you = await User.findOne({ _id : req.user._id })
            // if (!you.following.includes(_id)) {
                await User.updateOne({ _id }, { $inc : {  followingOfUser : 1 } })
                await User.updateOne({ _id : req.user._id }, { $addToSet : {  following : _id } })
                await User.updateOne({ _id }, { $addToSet : { otherFollowing : req.user._id } })
            // }else {
                // await User.updateOne({ _id }, { $inc : {  followingOfUser : -1 } })
                // await User.updateOne({ _id : req.user._id }, { $pull : {  following : _id } })
                // await User.updateOne({ _id }, { $pull : { otherFollowing : req.user._id } })
            // }
            return res.status(200).json({
                message : "successfully",
            })
        } catch (error) {
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    unFlowingUser : async(req , res) => {
        try {
            const {_id} = req.params
            if (!_id) return res.status(404).json({
                message : "Not Found",
                success : true
            })
            // const you = await User.findOne({ _id : req.user._id })
            // if (!you.following.includes(_id)) {
                // await User.updateOne({ _id }, { $inc : {  followingOfUser : 1 } })
                // await User.updateOne({ _id : req.user._id }, { $addToSet : {  following : _id } })
                // await User.updateOne({ _id }, { $addToSet : { otherFollowing : req.user._id } })
            // }else {
                await User.updateOne({ _id }, { $inc : {  followingOfUser : -1 } })
                await User.updateOne({ _id : req.user._id }, { $pull : {  following : _id } })
                await User.updateOne({ _id }, { $pull : { otherFollowing : req.user._id } })
            // }
            return res.status(200).json({
                message : "successfully",
            })
        } catch (error) {
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    addFamily : async(req , res) => {
        try {
            const {_id} = req.params
            const user = await User.findOne({_id : req.user._id})
            if (!user.family.includes(_id)) {
                await User.updateOne({ _id : req.user._id}, { $addToSet : { family : _id } })
                await User.updateOne({ _id}, { $addToSet : { family : req.user._id } })
            }else {
                await User.updateOne({ _id : req.user._id}, { $pull : { family : _id } })
                await User.updateOne({ _id}, { $pull : { family : req.user._id } })
            }
            return res.status(200).json({
                message : "successfully"
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    setAddress : async(req , res) => {
        try {
            const { country , home , from } = req.body
            if (!country || !home || !from) return res.status(404).json({
                message : "you must enter full fields"
            })
            await User.findByIdAndUpdate({ _id :req.user._id }, { $set : { address : req.body } })
            return res.status(200).json({
                message : "successfully",
                address : {
                    country,
                    home,
                    from
                }
            })

        } catch (error) {
            return res.status(500).json({
                message : "fail",
                success : false
            })
        }
    },


    unAddfriend : async(req , res) => {
        try {
            const { _id} = req.params
            const UserOnly =await User.findOne({_id : req.user._id})
            
                await User.updateOne({ _id : req.user._id }, { $pull : 
                    { addFriends : _id } 
                }, {new : true})
                await User.updateOne({ _id }, { $pull : 
                    { listAwait : req.user._id } 
                }, {new : true})
                if (UserOnly.following.includes(_id)) {
                    await User.updateOne({ _id : req.user._id }, { $pull : {  following : _id } })
                    await User.updateOne({ _id }, { $inc : {  followingOfUser : -1 } })
                    await User.updateOne({ _id }, { $pull : { otherFollowing : req.user._id } })
                    }
                return res.status(200).json({
                    message : "unAdd success",
                    success : true
                })
        } catch (error) {
            console.log(error);
            return res.status(404).json({
                success : false,
                message : "add fail"
            })
        }
    },

    deleteFriend : async(req, res) => {
        try {
            const {_id} = req.params
            const you =await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { friends : _id } })
            const other =await User.findByIdAndUpdate({_id}, { $pull : { friends : req.user._id } })

            return res.status(200).json({
                message : "delete friend success",
                success : true
            })
        } catch (error) {
            return res.status(500).json({
                message : "error from server",
                code : 500
            })
        }
    },

    NoAdd : async(req , res) => {
        try {
            const {_id} = req.params
            await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { listAwait : _id } })
            await User.findByIdAndUpdate({_id }, { $pull : { addFriends : req.user._id } })
            return res.status(200).json({
                success : true
            })
        } catch (error) {
            return res.status(500).json({
                success : false
            })
        }
    },

    searchUser : async(req , res) => {
        try {
            const { q } = req.query
            const page = +req.query.page || 1
            const limit = +req.query.limit || process.env.LIMIT_PRODUCT
            const limitBlogs = +req.query.limitBlog || process.env.LIMIT_PRODUCT
            const limitVideos = +req.query.limitVideo || process.env.LIMIT_PRODUCT
            const skip = (page - 1) * limit
            const user = await User.find().limit(limit)
            const blog = await Blog.find().limit(limitBlogs).populate("userId", "_id avatar fullName").sort({ likes : -1 })
            const video = await Video.find().limit(limitVideos).populate("userId", "_id avatar fullName").sort({ likes : -1 })
            const result = await user.filter((us) => {
                return us.fullName.includes(q)
            })
            const result1 = await blog.filter((us) => {
                return us.userId.fullName.includes(q)
            })

            const result2 = await video.filter((us) => {
                return us.title.includes(q) || us.userId.fullName.includes(q)
            })

            return res.status(200).json({
                success : true,
                data : result,
                dataBlog : result1,
                dataVideo : result2
            })
        } catch (error) {
            console.log(error);
            return res.status(404).json({
                message : "not found"
            })
        }
    }

}

module.exports = UserControllers