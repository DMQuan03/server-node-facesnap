const jwt = require("jsonwebtoken")

const MiddleWareJWT = {

    verifyToken : async(req , res , next) => {
        try {
            const AuthorizationHeader = req.headers["authorization"]
            const token = AuthorizationHeader.split(" ")[1]
            if (!token) return res.status(404).json({
                success : false,
                message : "token deformation"
            })
            jwt.verify(token, process.env.ACCESS_TOKEN , (err , user) => {
                if (err) throw new Error("token expire time")
                req.user = user
                next()
            })
        } catch (error) {
            res.status(500).json({
                success : false,
                message : "ERROR from server"
            })
        } 
    },

    isAdmin : async(req, res, next) => {
        try {
            if (req.user.role !== "admin") return res.status(403).json({
                message : "you must is admin",
                success : false
            })
            next()
        } catch (error) {
            return res.status(500).json({
                message : "ERROR from server",
                success : false
            })
        }
    }

}

module.exports = MiddleWareJWT