const { 
    createBlog,
    getAllBlog,
    deleteBlog,
    updateBlog,
    likeBlog, 
    disLikeBlog,
    shareBlog,
    unShareBlog,
    getBlogOfUser} = require("../controllers/blog")
const MiddleWareJWT = require("../middleware/jwt")
const Router = require("express").Router()

Router.post("/create", MiddleWareJWT.verifyToken ,createBlog)// done //
Router.get("/", MiddleWareJWT.verifyToken ,getAllBlog) // done //
Router.delete("/deleteblog/:_id", MiddleWareJWT.verifyToken ,deleteBlog) // done //
Router.put("/like/:_id", MiddleWareJWT.verifyToken ,likeBlog) // done //
Router.put("/dislike/:_id", MiddleWareJWT.verifyToken ,disLikeBlog) // done //
Router.put("/share/:_id", MiddleWareJWT.verifyToken ,shareBlog) // done //
Router.put("/unshare/:_id", MiddleWareJWT.verifyToken ,unShareBlog) // done //
Router.patch("/update/:_id", MiddleWareJWT.verifyToken ,updateBlog) // done //
Router.get("/getblogofuser/:_id", MiddleWareJWT.verifyToken ,getBlogOfUser) // done //

module.exports = Router