const PRD = require("../models/product")
const User = require("../models/user")

const ProductController = {
    createProduct : async(req , res) => {
        try {
            const { 
                title 
                , description 
                , shopAddress 
                , img
                , quantity
                , category
                , price
            } = req.body
            if (!title || !description || !shopAddress
            || !img || !quantity || !category    
            ) {
                return res.status(404).json({
                    success : false,
                    message : "Bạn cần nhập đầy đủ thông tin sản phẩm"
                })
            }
            const newPRD = await new PRD({
                title,
                description,
                img,
                category,
                quantity,
                shopAddress,
                price,
                userId : req.user._id
            })
            await newPRD.save()
            return res.status(200).json({
                success : true,
                data : newPRD
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success : false,
                message : "fail"
            })
        }
    },
    deleteProduct : async(req , res) => {
        try {
            const {_id} = req.params
            if (!_id) throw new Error("Not found")
            const OnlyPrd = await PRD.findOne({_id})
            if (req.user._id === OnlyPrd.userId.toString()) {
                await PRD.findByIdAndDelete({_id})
            }
            return res.status(200).json({
                success : true,
                message : "deleted product"
            })
        } catch (error) {
            return res.status(403)
        }
    },
    getProduct : async(req , res) => {
        try {
            const { limit } = req.query
            if (!limit) limit = 10
            const result = PRD.find().limit(limit).populate("userId", "fullName avatar _id")
            return res.status(200).json({
                success : true,
                data : result
            })
        } catch (error) {
            return res.status(404).json({
                success : false,
                message : "Not found"
            })
        }
    },
    buyProduct : async(req , res) => {
        try {
            const { _id } = req.params
            const {quantity} = req.body
            if (!_id) throw new Error("product is'nt valid")
            const OnlyProduct = await PRD.findOne({_id})
            if (_id && req.user._id && req.user._id !== OnlyProduct.userId.toString()
            && OnlyProduct.quantity >= quantity
            ) {
                console.log(1);
                await User.findByIdAndUpdate({_id : req.user._id}, 
                {$addToSet : { 
                    cart : {
                        idProduct : _id,
                        quantity,
                        status : "pending"
                    }
                }}
                )
                return res.status(200).json({
                    success : true,
                    data : OnlyProduct
                })
            }else {
                return res.status(200).json({
                    success : true,
                    message : "bạn không thể mua sản phẩm này"
                })
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message : "buy fail",
                success : false
            })
        }
    }
}

module.exports = ProductController