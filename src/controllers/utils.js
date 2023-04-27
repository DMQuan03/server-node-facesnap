const Cmt = require("../models/comment")
const Video = require("../models/video")
const User = require("../models/user")
const AllVideoAndBlog = require("../models/videoandpost")

const CommentController = {
    getCommentOfVideo : async(req , res) => {
        console.log(req.params);
        try {
            const { _id } = req.params
            await Video.findByIdAndUpdate({ _id }, { $inc : { views : 1} })
            await AllVideoAndBlog.findOneAndUpdate({ idCateGory : _id }, { $inc : { views : 1} })
            const listComment = await Cmt.find({ idPOST : _id }).populate("userId", "avatar fullName _id")
            return res.status(200).json({
                success : true,
                data : listComment
            })
        } catch (error) {
            return res.status(404).json({
                message : "get comment fail",
                success : false
            })
        }
    },
    getListFriends : async(req , res) => {
        try {
            const listFriends = await User.findOne({_id : req.user._id}).populate("friends", "_id fullName avatar")
    
            const data = await listFriends.friends
            return res.status(200).json({
                success : true,
                data
            })
        } catch (error) {
            return res.status(404).json({
                success : false,
                message : "get list friends fail"
            })
        }

    },
    getAllBlogAndVideo : async(req , res) => {
        try {
            const page = +req.query.page || 1
            const limit = +req.query.limit || 5
            const skip = (page - 1) * limit
            const BlogAndVideo = await AllVideoAndBlog.find().limit(limit)
            .populate("userId", "_id fullName avatar")

            return res.status(200).json({
                success : true,
                data : BlogAndVideo
            })

        } catch (error) {
            return res.status(404).json({
                success : false,
                message : "Không thấy Video hay Blog nào"
            })
        }
    }
}

module.exports = CommentController