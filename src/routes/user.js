const Router = require("express").Router()
const ctrls = require("../controllers/user")
const MiddleWareJWT = require("../middleware/jwt")

Router.get("/",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.getAllUser ) // done //
Router.get("/currentuser", MiddleWareJWT.verifyToken,ctrls.getCurrentUser ) // done //
Router.get("/searchuser", MiddleWareJWT.verifyToken,ctrls.searchUser ) // done //
Router.post("/register", ctrls.registerUser ) // done //
Router.post("/login", ctrls.loginUser ) // done //
Router.patch("/updateuser",MiddleWareJWT.verifyToken, ctrls.updateUser ) // done //
Router.patch("/updateaddress",MiddleWareJWT.verifyToken, ctrls.setAddress )
Router.delete("/deleteuser/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.deleteUser )
Router.put("/adminblog/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.adminBlock )
Router.put("/addfamily/:_id",MiddleWareJWT.verifyToken, ctrls.addFamily )
Router.put("/unaddfriend/:_id",MiddleWareJWT.verifyToken, ctrls.unAddfriend ) // done //
Router.put("/unfriend/:_id",MiddleWareJWT.verifyToken, ctrls.deleteFriend ) // done //
Router.put("/addadmin/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.AddAdmin )
Router.put("/deleteadmin/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.deleteAdmin )
Router.put("/settick/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.setTickUser )
Router.put("/blockuser/:_id",MiddleWareJWT.verifyToken, ctrls.BlockUser )
Router.put("/following/:_id",MiddleWareJWT.verifyToken, ctrls.followingUser ) // done //
Router.put("/unfollowing/:_id",MiddleWareJWT.verifyToken, ctrls.unFlowingUser ) // done //
Router.put("/deletetick/:_id",MiddleWareJWT.verifyToken, MiddleWareJWT.isAdmin, ctrls.deleteTick )
Router.put("/noaddfriend/:_id",MiddleWareJWT.verifyToken, ctrls.NoAdd )
Router.get("/onlyuser/:_id", MiddleWareJWT.verifyToken ,ctrls.getOnlyUser ) // done //

module.exports = Router