const Rooms = require("../models/chatroom")
const User = require("../models/user")
const Messages = require("../models/message")
const { v4 } = require("uuid")

const ChatRoomController = {
    outRoom : async(req , res) => {
        console.log(req.body.RoomId);
        try {
            await User.findByIdAndUpdate({_id : req.user._id}, { $pull : { roomChats : req.body.RoomId} },)
            await Rooms.findByIdAndUpdate({_id : req.body.RoomId}, { $pull : { members : req.user._id} })
            const onlyRoom = await Rooms.findOne({_id : req.body.RoomId})
            if (onlyRoom?.members?.length <= 1 && onlyRoom?.description !== "group") {
                await Rooms.findByIdAndDelete({_id : req.body.RoomId})
                const result = await Messages.find({ idRoom : req.body.RoomId })
                for (let i of result) {
                    await Messages.findByIdAndDelete({ _id : i._id })
                }
                return res.status(200).json({
                    success : true,
                    message : "deleted room"
                })
            }
            return res.status(200).json({
                success : true,
                message : "out room success"
            })
        } catch (error) {
            console.log(error);
            return res.status(300).json({
                success : false,
                message : "out room fail"
            })
        }
    },

    deleteRoom : async(req , res) => {
        console.log(req.params._id);
        try {
            const OnlyRoom = await Rooms.findOne({ _id : req.params._id }).populate("members", "_id ")
            if (OnlyRoom.createBy.includes(req.user._id) || req.user.role === "admin" ) {
                for (let i of OnlyRoom.members) {
                    await User.findByIdAndUpdate({_id : i._id.toString()}, { $pull : { roomChats : req.params._id} })
                }
                const result = await Messages.find({ idRoom : req.params._id })
                for (let i of result) {
                    await Messages.findByIdAndDelete({ _id : i._id })
                }
                await Rooms.findByIdAndDelete({ _id : req.params._id })
            }
            return res.status(200).json({
                success : true,
                message : "room deleted"
            })
        } catch (error) {
            return res.status(403).json({
                success : false,
                message : "you cant delete Room"
            })
        }
    },
    
    createGroup : async(req , res) => {
        try {
            if (!req.body.nameRoom) return res.status(404).json({
                success : false,
                message : "bạn cần chọn 1 tên room"
            })
            const newGroup = await new Rooms({
                nameRoom : req.body.nameRoom,
                createBy : req.user._id,
                members : [
                    req.user._id
                ],
                admin : [
                    req.user._id
                ],
                idCheck1 : v4(),
                idCheck2 : v4(),
                avatarRoom : req.user.avatar,
                user1 : req.user._id,
                description : "group"
            })
            await newGroup.save()
            await User.findByIdAndUpdate({_id : req.user._id}, { $addToSet : { roomChats : newGroup._id } })
            return res.status(200).json({
                success : true,
                message : "add room successfully"
            })
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({
                success : false,
                message : "create Room fail"
            })
        }
    },

    addUserToRoom : async(req , res) => {
        console.log(req.params);
        console.log(req.body);
        try {
            const RoomsChat = await Rooms.findOne({ _id : req.params._id }).populate("members", "_id")
            const result = RoomsChat?.members?.every((el) => {
                return el._id !== req.body.userId
            })
            if (result) {
                await Rooms.findByIdAndUpdate({ _id : req.params._id}, { $addToSet : { members : req.body.userId } })
                const Users = await User.findByIdAndUpdate({ _id : req.body.userId}, { $addToSet : { roomChats : req.params._id } })
                const { avatar , ...rest } = Users
                return res.status(200).json({
                    success :true,
                    message : "user add success"
                })
            }else {
                console.log("user đã trong room");
                return 0
            }
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({
                success : false,
                Messages : "add user to room fail"
            })
        }
    },

    editRoom : async(req , res) => {
        try {
            const { _id} = req.params
            if (!_id) return res.status(404).json({
                success : false,
                message : `room isn't valid`
            })
            const {nameRoom, themes, avatarRoom} = req.body
            const OnlyRoom = await Rooms.findOne({ _id })
            if (!nameRoom) req.body.nameRoom = OnlyRoom.nameRoom
            if (!themes) req.body.themes = OnlyRoom.themes
            if (!avatarRoom) req.body.avatarRoom = OnlyRoom.avatarRoom
            if (OnlyRoom.createBy.includes(req.user._id) || OnlyRoom.admin.includes(req.user._id)) {
                const data = await Rooms.findByIdAndUpdate({ _id}, req.body, {new  :true})
                return res.status(200).json({
                    success : true,
                    data
                })
            }else {
                return res.status(403).json({
                    success :true,
                    message : "you cant edit room"
                })
            }
        } catch (error) {
            console.log(1);
            return res.status(500).json({
                success : false,
                message : "edit room fail"
            })
        }
    },

    blogChatUser : async(req , res) => {
        try {
            const { _id } = req.params
            const { userId } = req.body
            const OnlyRoom = await Rooms.findOne({ _id })
            if (OnlyRoom.admin.includes(req.user._id) || OnlyRoom.createBy(req.user._id)) {
                if (!OnlyRoom.createBy.includes(userId) || !OnlyRoom.admin.includes(userId) && req.user._id !== req.body.userId ) {
                    await Rooms.findByIdAndUpdate({ _id}, { $addToSet : { blockChat : userId } })
                    return res.status(200).json({
                        success : true,
                        message : "user blocked"
                    })
                }else {
                    return res.status(403).json({
                        success : false,
                        message : "you cant block chat father of admin"
                    })
                }
            }
        } catch (error) {
            return res.status(403).json({
                success : "false",

            })
        }
    },
    unBlockChatUser : async(req , res) => {
        try {
            const { _id } = req.params
            const { userId } = req.body
            const OnlyRoom = await Rooms.findOne({ _id })
            if (OnlyRoom.admin.includes(req.user._id) || OnlyRoom.createBy(req.user._id)) {
                if (!OnlyRoom.createBy.includes(userId) || !OnlyRoom.admin.includes(userId) && req.user._id !== req.body.userId ) {
                    await Rooms.findByIdAndUpdate({ _id}, { $pull : { blockChat : userId } })
                    return res.status(200).json({
                        success : true,
                        message : "unBlock chat user successfully"
                    })
                }else {
                    return res.status(403).json({
                        success : false,
                        message : "you cant block chat father of admin"
                    })
                }
            }
        } catch (error) {
            return res.status(403).json({
                success : false,
                message : "you cant unblock chat user"
            })
        }
    },

    adminRoom : async(req , res) => {
        console.log(req.params);
        console.log(req.body);
        try {
            const { _id } = req.params
            const { userId } = req.body
            if (!_id) return res.status(404).json({
                success : false,
                message : "not found"
            })
            if (!userId) throw new Error({ 
                message : "user isn't valid"
            })
            const OnlyRoom = await Rooms.findOne({ _id })
            if (!OnlyRoom) return res.status(404).json({
                success : false,
                message : "not found"
            })
            if (OnlyRoom.createBy.includes(req.user._id) && req.user._id !== req.body.userId && !OnlyRoom.createBy.includes(req.body.userId)) {
                console.log(1);
                await Rooms.findByIdAndUpdate({ _id}, { $addToSet : { admin : req.body.userId }}, { new  :true })
                return res.status(200).json({
                    message : "successfully",
                    success : true
                })
            }
        } catch (error) {
            return res.status(403).json({
                success :false,
                message : "khong the phan quyen"
            })
        }
    }
}

module.exports = ChatRoomController