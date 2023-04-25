const Router = require("express").Router()
const ctrls = require("../controllers/rooms")
const MiddleWare = require("../middleware/jwt")
Router.post("/outroom", MiddleWare.verifyToken, ctrls.outRoom ) // done //
Router.post("/addgroup", MiddleWare.verifyToken, ctrls.createGroup ) // done //
Router.delete("/deleteroom/:_id", MiddleWare.verifyToken, ctrls.deleteRoom ) // done //
Router.put("/addusertoroom/:_id", MiddleWare.verifyToken, ctrls.addUserToRoom ) // done //
Router.put("/updateroom/:_id", MiddleWare.verifyToken, ctrls.editRoom ) // done //
Router.put("/blockchatuser/:_id", MiddleWare.verifyToken, ctrls.blogChatUser) // done //
Router.put("/unblockchatuser/:_id", MiddleWare.verifyToken, ctrls.unBlockChatUser) // done //
Router.put("/admingroup/:_id", MiddleWare.verifyToken, ctrls.adminRoom) // done //


module.exports = Router