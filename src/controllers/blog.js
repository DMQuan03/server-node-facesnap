const Blog = require("../models/blog")
const User = require("../models/user")
const Cmt = require("../models/comment")
const ALLVIDEOANDBLOG = require("../models/videoandpost")

const createBlog = async(req , res) => {
    try {
        const {title , img} = req.body
        if (!title) return res.status(404).json({
            message : "missing input"
        })
        const newBlog = await new Blog({
            title,
            userId : req.user._id,
            img
        })
        const user = await User.updateOne({_id : req.user._id}, { $addToSet : { blog : newBlog._id } })
        await newBlog.save()
        const newVideoAndPost = await new ALLVIDEOANDBLOG({
            title : req.body.title,
            img : req.body.video,
            userId : req.user._id,
            idCateGory : newBlog._id,
            category : "blog"
        }) 
        await newVideoAndPost.save()
        await newVideoAndPost.populate("userId", "fullName _id avatar")
        return res.status(200).json({
            message : "successfully",
            success : true,
            newVideoAndPost
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : error.message,
            success : false
        })
    }
}

const getAllBlog = async(req , res) => {
    try {
        const page = +req.query.page || 1
        const limit = +req.query.limit || process.env.LIMIT_PRODUCT
        const skip = (page - 1) * limit
        const result = await Blog.find().sort({likes : -1}).populate("userId", "fullName avatar _id").limit(limit)
        
        const count = await Blog.find().countDocuments()
        return res.status(200).json({
            message : "successfully",
            data : result,
            count
        })
    } catch (error) {
        return res.status(500).json({
            message : error.message,
            success : false
        })
    }
}

const deleteBlog = async(req , res) => {
    try {
        const {_id} = req.params
        const data = await Blog.findOne({ _id }).populate("userId", "_id fullName")
        const user = await User.findOne({ _id : req.user._id })
        if (  user._id.toString() === data.userId._id.toString() || req.user.role === "admin") {
            const BlogOnly = await Blog.findOne({_id})
            const allUser = await User.find()
            const CmtOfBlog = await BlogOnly.comment
            const fakeListUser = [...allUser]
            for (let i of CmtOfBlog) {
                await Cmt.findByIdAndDelete({_id : i.toString()})
            }
            const dataLength = fakeListUser.length
            for (let i = 0 ; i < dataLength ; i ++ ) {
                for ( let j = 0 ; j < fakeListUser[i].shares.length ; j ++) {
                    if (fakeListUser[i].shares[j].toString() === _id.toString()) {
                        await User.findByIdAndUpdate({_id : fakeListUser[i]._id.toString()}, { $pull : { shares : _id} })
                    }
                }
            }
            
            const user = await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { blog : _id }})
            await ALLVIDEOANDBLOG.findOneAndDelete({ idCateGory : _id})
            await Blog.findByIdAndDelete(_id)
            return res.status(200).json({
                success : true,
                message : "deleted your blog"
            })
        }else {
            return res.status(403).json({
                message : "you cant remove blog",
                status : 403,
                success : false
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : "ERROR from server",
            success : false
        })
    }
}

const updateBlog = async(req , res) => {
    console.log(req.params);
    try {
        const {_id} = req.params
        if(!_id) throw new Error("missing input")
        const onlyBlog = await Blog.findOne({ _id })
        const {title} = req.body
        if (!title) req.body.title = onlyBlog.title
        if (onlyBlog.userId.toString() === req.user._id || req.user.role === "admin" ) {
            await Blog.findByIdAndUpdate(_id , req.body , {new : true})
            await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id} , req.body , {new : true})
            return res.status(200).json({
                success : true
            })
        }else {
            return res.status(403).json({
                message : "you cant update it",
                success : false
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : "fail",
            code : 500,
        })
    }
}

const likeBlog = async(req , res) => {
    try {
        const { _id } = req.params
            await Blog.findByIdAndUpdate(_id , {
                 $inc : { likes : 1 } 
                }, {new : true})
            await Blog.updateOne({_id}, { $addToSet : { userLikes : req.user._id } }, {new : true} )

            await ALLVIDEOANDBLOG.findOneAndUpdate({idCateGory : _id}, 
                {
                    $inc : {
                        likes : 1
                    }
                }, {new : true})
            await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id }, { $addToSet : { userLikes : req.user._id }}, {new : true})
   
        return res.status(200).json({
            success : true
        })
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            message : "like fail",
            success : false
        })
    }
}

const disLikeBlog = async(req , res) => {
    try {
        const { _id } = req.params
            await Blog.findByIdAndUpdate(_id , {
                 $inc : { likes : -1 } 
                }, {new : true})
            await Blog.updateOne({_id}, { $pull : { userLikes : req.user._id } }, {new : true} )

            await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id } , {
                $inc : { likes : -1 }
               }, {new : true})
           await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id }, { $pull : { userLikes : req.user._id } }, {new : true} )
        return res.status(200).json({
            success : true
        })
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            message : "like fail",
            success : false
        })
    }
}

const shareBlog = async(req , res) => {
    try {
        const {_id} = req.params
        await User.updateOne({_id : req.user._id},
            { $addToSet :
                { shares : _id } }, {new : true})
        await Blog.findByIdAndUpdate(_id , { $inc : { shares : 1 } })
        await Blog.findByIdAndUpdate(_id , { $addToSet : { userShares : req.user._id } }, {new : true})
        await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id } , {
            $inc : { shares : 1 }
           }, {new : true})
        await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id }, { $addToSet : { userShares : req.user._id } }, {new : true} )
        return res.status(200).json({
            message : "share success",
            success : true
        })
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            message : "share fail",
            success : false
        })
    }
}

const unShareBlog = async(req , res) => {
    try {
        const {_id} = req.params
        await User.updateOne({_id : req.user._id},
            { $pull :
                { shares : _id } }, {new : true})
        await Blog.findByIdAndUpdate(_id , { $inc : { shares : -1 } })
        await Blog.findByIdAndUpdate(_id , { $pull : { userShares : req.user._id } }, {new : true})
        await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id } , {
            $inc : { shares : -1 }
           }, {new : true})
        await ALLVIDEOANDBLOG.findOneAndUpdate({ idCateGory : _id }, { $pull : { userShares : req.user._id } }, {new : true} )
        return res.status(200).json({
            message : "share success",
            success : true
        })
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            message : "share fail",
            success : false
        })
    }
}

const getBlogOfUser = async(req , res) => {
    try {
        const { _id } = req.params
        if (!_id) { return res.status(404).json({
            message : "Not Found",
            code : 404
        })}
        const response = await Blog.find({ userId : _id}).populate("userId", "fullName avatar")
        return res.status(200).json({
            success : true,
            data : response
        })
    } catch (error) {
        return res.status(404).json({
            success : false,
            message : "Not Found"
        })
    }
}

module.exports = {
    createBlog,
    getAllBlog,
    deleteBlog,
    updateBlog,
    likeBlog,
    disLikeBlog,
    shareBlog,
    unShareBlog,
    getBlogOfUser
}