const Router = require("express").Router()
const MiddleWareToken = require("../middleware/jwt")
const ctrls = require("../controllers/utils")
Router.get("/getcomment/:_id",MiddleWareToken.verifyToken , ctrls.getCommentOfVideo )
Router.get("/getlistfriends",MiddleWareToken.verifyToken , ctrls.getListFriends )

module.exports = Router