const Video = require("../models/video")
const User = require("../models/user")
const Cmt = require("../models/comment")
const ALLVIDEOANDBLOG = require("../models/videoandpost")
const VideoController = {

    createVideo : async( req , res) => {
        console.log(req.body);
        try {
            const {video , title} = req.body
            const newVideo = await new Video({
                title,
                video,
                userId : req.user._id
            })
            await newVideo.save()
            const newVideoAndPost = await new ALLVIDEOANDBLOG({
                title,
                video,
                userId : req.user._id,
                idCateGory : newVideo._id,
                category : "video"
            }) 
            await newVideoAndPost.save()
            newVideoAndPost.populate("userId", "fullName avatar _id")
            await User.findByIdAndUpdate({ _id : req.user._id }, { $addToSet : { videos : newVideo._id } })
            return res.status(200).json({
                success : true,
                newVideoAndPost
            })
        } catch (error) {
            return res.status(500).json({
                success : false,
                message : "create Video fail"
            })
        }
    },

    deleteVideo : async(req , res) => {
        try {
            const {_id} = req.params
            const data = await Video.findOne({ _id }).populate("userId", "_id fullName")
            const user = await User.findOne({ _id : req.user._id })
            if (  user._id.toString() === data.userId._id.toString() || req.user.role === "admin") {
                const user = await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { videos : _id }})
                await Video.findByIdAndDelete(_id)
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
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    },

    getAllVideo : async(req , res) => {
        try {
            const page = +req.query.page || 1
            const limit = +req.query.limit || process.env.LIMIT_PRODUCT
            const skip = (page - 1) * limit
            const videos = await Video.find().populate("userId", "_id fullName avatar").sort({ likes : -1})
            .limit(limit)
            return res.status(200).json({
                success : true,
                data : videos,
                
            })
        } catch (error) {
            return res.status(500).json({
                success : false,
                message : "Get Video Fail"
            })
        }
    },

    likeVideo : async(req , res) => {
        try {
            const { _id } = req.params
           
            await Video.findByIdAndUpdate(_id , {
                 $inc : { likes : 1 } 
                }, {new : true})
            await Video.updateOne({_id}, { $addToSet : { userLikes : req.user._id } }, {new : true} )


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
    },
    
    disLikeVideo: async(req , res) => {
        try {
            const { _id } = req.params
                await Video.findByIdAndUpdate(_id , {
                     $inc : { likes : -1 } 
                    }, {new : true})
                await Video.updateOne({_id}, { $pull : { userLikes : req.user._id } }, {new : true} )

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
    },

    deleteVideo : async(req , res) => {
        try {
            const {_id} = req.params
            const data = await Video.findOne({ _id }).populate("userId", "_id fullName")
            const user = await User.findOne({ _id : req.user._id })
            if (  user._id.toString() === data.userId._id.toString() || req.user.role === "admin") {
            const VideoOnly = await Video.findOne({_id})
            const allUser = await User.find()
            const CmtOfVideo  = await VideoOnly.comment
            const fakeListUser = [...allUser]
            for (let i of CmtOfVideo) {
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
            
            const user = await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { videos : _id }})
            await Video.findByIdAndDelete(_id)
            return res.status(200).json({
                success : true,
                message : "deleted your blog"
            })
        }
        } catch (error) {
            console.log(error);
            return res.status(403).json({
                message :" you cant delete video",
                success : false
            })
        }
    },
    updateVideo : async(req , res) => { 
        try {
            const {_id} = req.params
            if(!_id) throw new Error("Not found")
            const onLyVideo = await Video.findOne({ _id })
            const {video , title} = req.body
            if (!video) req.body.video = onLyVideo.video
            if (!title) req.body.title = onLyVideo.title
            if (req.body.title === "delete") {
                req.body.title === ""
                await Video.findByIdAndUpdate({_id}, { $set : { title : null }})
                return res.status(200).json({
                    success : true
            })
            }
            if (req.body.video === "delete") {
                return res.status(403).json({
                    message : "cant delete Video"
                })
            }
            if ( onLyVideo.userId.toString() === req.user._id || req.user.role === "admin" ) {
                await Video.findByIdAndUpdate(_id , req.body , {new : true})
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
            return res.status(403).json({
                message : "you cant edit video",
                success : false
            })
        }
    },
    searchVideo : async(req , res) => {
        try {
            const { q , limit = 5 } = req.query

            const AllVideo = await Video.find().populate("userId", "_id fullName avatar")
            .sort({ likes : -1}).limit(limit)
            const result = AllVideo.filter(el => {
                return el.title.includes(q) || el.userId.fullName.includes(q)
            })

            return res.status(200).json({
                success : true,
                data : result
            })
        } catch (error) {
            return res.status(404).json({
                message : "NOT FOUND",
                code : 404
            })
        }
    }
}

module.exports = VideoController