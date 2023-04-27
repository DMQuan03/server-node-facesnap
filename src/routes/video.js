const Router = require("express").Router()
const ctrls = require("../controllers/video")
const Middleware = require("../middleware/jwt")
Router.get("/", Middleware.verifyToken ,ctrls.getAllVideo)
Router.post("/create", Middleware.verifyToken ,ctrls.createVideo)
Router.get("/searchvideo", Middleware.verifyToken ,ctrls.searchVideo)
Router.put("/likevideo/:_id", Middleware.verifyToken ,ctrls.likeVideo)
Router.put("/dislikevideo/:_id", Middleware.verifyToken ,ctrls.disLikeVideo)
Router.patch("/editvideo/:_id", Middleware.verifyToken ,ctrls.updateVideo)
Router.delete("/deletevideo/:_id", Middleware.verifyToken ,ctrls.deleteVideo)

module.exports = Router