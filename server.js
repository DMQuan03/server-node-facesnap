const express = require("express")
const cors = require("cors")
const appRouter = require("./src/routes/index")
const db = require("./src/config/configdb")
const app = express()
const jwt = require("jsonwebtoken")
const socket = require("socket.io")

// models
const User = require("./src/models/user")
const Blog = require("./src/models/blog")
const Cmt = require("./src/models/comment")
const Video = require("./src/models/video")
const Rooms = require("./src/models/chatroom")
const Mess = require("./src/models/message")
const VIDEOANDPOST = require("./src/models/videoandpost")

// middleware
const middleware = require("./src/middleware/jwt")
const LoginUser = require("./src/controllers/user")

app.use(cors())

app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "1800");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
});
app.use(express.json())
require("dotenv").config()
app.use(express.urlencoded({ extended : true }))
const PORT = process.env.PORT || 3456


db.connect()
appRouter(app)


const server = app.listen(PORT , () => {
    console.log(`http://localhost:${PORT}`)
})

const io = socket(server, {
    cors : {
        origin : "https://velvety-kheer-5d48e5.netlify.app",
        credentials : true,
    }
})

global.onlineUser = new Map()

// io.use(function (socket, next) {
//     if (socket.handshake.query && socket.handshake.query.token) {
//         jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN, function (err, decoded) {
//             if (err) { return 0}
//             socket.decoded = decoded;
//             next();
//         });
//     }
//     else {
//         next(new Error('Authentication error'));
//         return 2
//     }
// })

io.on("connection", async(socket) => {
    // config user when connect to server
    // socket.username = socket.decoded.fullName
    // socket.avatarUser = socket.decoded.avatar
    // socket.userId = socket.decoded._id
    // socket.role = socket.decoded.role
    // socket.join(socket.decoded._id)
    // console.log(socket.decoded);
    // await User.findByIdAndUpdate({ _id : socket.userId }, { $set : { isActive : true } })
    // await User.findByIdAndUpdate({ _id : socket.userId }, { $set : { sorts : 1 } })
    socket.on("send_req_to_user_add", async(data) => {
        try {
            const UserOnly =await User.findOne({_id : data.data.userId})
            const result = UserOnly.listAwait.every((el) => {
                return el.toString() !== data.data.currentUserId
            })
            if (result) {
                socket.join(data.data.userId)
                    await User.updateOne({ _id : data.data.currentUserId }, { $addToSet : 
                        { addFriends : data.data.userId } 
                    }, {new : true})
                    await User.updateOne({ _id : data.data.userId }, { $addToSet : 
                        { listAwait : data.data.currentUserId } 
                    }, {new : true})
                    if (!UserOnly.following.includes(data.data.currentUserId)) {
                        await User.updateOne({ _id : data.data.currentUserId }, { $addToSet : {  following : data.data.userId } })
                        await User.updateOne({_id : data.data.userId }, { $inc : {  followingOfUser : 1 } })
                        await User.updateOne({ _id : data.data.userId  }, { $addToSet : { otherFollowing : data.data.currentUserId } })
                    }
                    io.sockets.to(data.data.userId).emit("server_return_req_addFr", {
                        fullName : data.data.currentUserFullName,
                        avatar : data.data.currentUserAvatar,
                        date : Date.now()
                    })
        
                socket.leave(data.data.userId)
            }else {
                console.log("bạn đã gửi lời mời kết bạn đến người này rồi");
                return 0
            }
        } catch (error) {
            throw new Error(error.message)
        }
    })

    socket.on("add_Friend", async(data) => {
        socket.join(data.infoUser.userId)
            const UserOnly =await User.findOne({_id : data.infoUser.userId})
            await User.updateOne({ _id : data.infoUser.currentUserId }, { $addToSet : 
                { friends : data.infoUser.userId } 
            }, {new : true})
            await User.updateOne({ _id : data.infoUser.currentUserId }, { $pull : 
                { listAwait : data.infoUser.userId } 
            }, {new : true})

            await User.updateOne({ _id : data.infoUser.userId }, { $addToSet : 
                { friends : data.infoUser.currentUserId } 
            }, {new : true})
            await User.updateOne({ _id : data.infoUser.userId }, { $pull : 
                { addFriends : data.infoUser.currentUserId } 
            }, {new : true})

            io.sockets.to(data.infoUser.userId).emit("server_return_req_addFrOk", {
                fullName : data.infoUser.currentUserId,
                avatar : data.infoUser.currentUserId,
            })
            const allRooms = await Rooms.find()
            const lengthRooms = allRooms.length
            if (lengthRooms === 0) {
                const newRoom = await new Rooms({
                    user1 : data.infoUser.currentUserId,
                    user2 : data.infoUser.userId,
                    members : [
                        data.infoUser.currentUserId,
                        data.infoUser.userId
                    ],
                    createBy : [
                        data.infoUser.currentUserId,
                        data.infoUser.userId
                    ],
                    admin : [
                        data.infoUser.currentUserId,
                        data.infoUser.userId
                    ],
                    idCheck1 : data.infoUser.currentUserId + data.infoUser.userId,
                    idCheck2 : data.infoUser.userId + data.infoUser.currentUserId
                })
                await User.findByIdAndUpdate({_id : data.infoUser.currentUserId}, { $addToSet : { roomChats : newRoom._id } })
                await User.findByIdAndUpdate({_id : data.infoUser.userId}, { $addToSet : { roomChats : newRoom._id } })
                await newRoom.save()
                console.log("success");
            }else {
                const checktrue = await data.infoUser.currentUserId + data.infoUser.userId
                const checktrue1 = await   data.infoUser.userId + data.infoUser.currentUserId
                const result1 = allRooms.every((el) => {
                    return el.idCheck1 !== checktrue
                })
                const result2 = allRooms.every((el) => {
                    return el.idCheck1 !== checktrue1
                })
                const result3 = allRooms.every((el) => {
                    return el.idCheck2 !== checktrue
                })
                const result4 = allRooms.every((el) => {
                    return el.idCheck2 !== checktrue1
                })
         
                if (result1 && result2 && result3 && result4) {
                        const newRoom = await new Rooms({
                            user1 : data.infoUser.currentUserId,
                            user2 : data.infoUser.userId,
                            members : [
                                data.infoUser.currentUserId,
                                data.infoUser.userId
                            ],
                            createBy : [
                                data.infoUser.currentUserId,
                                data.infoUser.userId
                            ],
                            admin : [
                                data.infoUser.currentUserId,
                                data.infoUser.userId
                            ],
                            idCheck1 : data.infoUser.currentUserId + data.infoUser.userId,
                            idCheck2 : data.infoUser.userId + data.infoUser.currentUserId
                        })
                        await User.findByIdAndUpdate({_id : data.infoUser.currentUserId}, { $addToSet : { roomChats : newRoom._id } })
                        await User.findByIdAndUpdate({_id : data.infoUser.userId}, { $addToSet : { roomChats : newRoom._id } })
                        await newRoom.save()
                        console.log("success");
                    }else {
                        console.log("room da ton tai");
                    }
            }
            // }
            io.sockets.to(data.infoUser.userId).emit("server_return_req_addFrOk", {
                fullName : data.infoUser.currentUserId,
                avatar : data.infoUser.currentUserId,
            })
            

        socket.leave(data.infoUser.userId)
    })

    socket.on("user_send_mess_room_chat", async(data) => {
        try {
            const onLyRooms = await Rooms.findOne({ _id : data.infoPayload.RoomId })
            if (onLyRooms.blockChat.includes(data.infoPayload.currentUserId)) {
                console.log("you have been blocked from chatting");
                return 0
            }
            for (let i of socket.rooms) {
                socket.leave(i)
            }
            socket.join(data.infoPayload.RoomId)
            const newMess = await new Mess({
                text : data.infoPayload.text,
                userId : data.infoPayload.currentUserId,
                idRoom : data.infoPayload.RoomId
            })
            await newMess.save()
            await Rooms.findOneAndUpdate({_id : data.infoPayload.RoomId}, { $addToSet : { messages : newMess._id } })
            const fakeData = {
                text : data.infoPayload.text,
                userId : {
                    fullName : data.infoPayload.currentUserFullName,
                    avatar : data.infoPayload.currentUserAvatar,
                    _id : data.infoPayload.currentUserId
                },
                idRoom : data.infoPayload.RoomId
            }
            io.sockets.to(data.infoPayload.RoomId).emit("user_send_mess_to_room", fakeData )
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("join_room", async(data) => {
        for (let i of socket.rooms) {
            await socket.leave(i)
        }
        await socket.join(data.id)
        console.log("vao room" + data.id);
    })

    socket.on("leave_room", (data) => {
        console.log('leave room : ' + data.id);
        for (let i of socket.rooms) {
            socket.leave(i)
        }
        socket.leave(data.id)
    })

    socket.on("leave_all_room", () => {
        console.log("test");
        for (let i of socket.rooms) {
            socket.leave(i)
        }
    })

    socket.on("getMessageRoomChat", async (data) => {
        try {
            const messages = await Rooms.findOne({ _id: data.idRoomChat }).populate("messages", "text userId idRoom createdAt likes disLikes").populate("members", "avatar")
            for (let i in messages.messages) {
                await messages.messages[i].populate("userId", "fullName avatar _id")
            }
            
            socket.emit("serer_return_message_of_ROOM", messages)
        } catch (error) {
            console.log(error)
            return 0
        }
    })

    // socket.on("add_room", async(data) => {
    //     console.log(data);
    //     try {
    //         const allRooms = await Rooms.find()
    //         const lengthRooms = allRooms.length
    //         if (lengthRooms === 0) {
    //             const newRoom = await new Rooms({
    //                 user1 : socket.userId,
    //                 user2 : data.userId,
    //                 members : [
    //                     socket.userId,
    //                     data.userId
    //                 ],
    //                 createBy : [
    //                     socket.userId,
    //                     data.userId
    //                 ],
    //                 admin : [
    //                     socket.userId,
    //                     data.userId
    //                 ],
    //                 idCheck1 : socket.userId + data.userId,
    //                 idCheck2 : data.userId + socket.userId
    //             })
    //             await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
    //             await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
    //             await newRoom.save()
    //             console.log("success");
    //             return 1
    //         }else {
    //             const checktrue = await socket.userId + data.userId
    //             const checktrue1 = await   data.userId + socket.userId
    //             const result1 = allRooms.every((el) => {
    //                 return el.idCheck1 !== checktrue
    //             })
    //             const result2 = allRooms.every((el) => {
    //                 return el.idCheck1 !== checktrue1
    //             })
    //             const result3 = allRooms.every((el) => {
    //                 return el.idCheck2 !== checktrue
    //             })
    //             const result4 = allRooms.every((el) => {
    //                 return el.idCheck2 !== checktrue1
    //             })
    //             if (result1 && result2 && result3 && result4) {
    //                     const newRoom = await new Rooms({
    //                         user1 : socket.userId,
    //                         user2 : data.userId,
    //                         members : [
    //                             socket.userId,
    //                             data.userId
    //                         ],
    //                         createBy : [
    //                             socket.userId,
    //                             data.userId
    //                         ],
    //                         admin : [
    //                             socket.userId,
    //                             data.userId
    //                         ],
    //                         idCheck1 : socket.userId + data.userId,
    //                         idCheck2 : data.userId + socket.userId
    //                     })
    //                     await newRoom.save()
    //                     await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
    //                     await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
    //                     socket.emit("add_room_success", newRoom)
    //                     return 1
    //                 }
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         return 0
    //     }
    // })

    socket.on("user_comment", async(data) => {
        try {
            socket.join(data.idBlog)
            const onLyBlog = await Blog.findOne({_id : data.idBlog})
            if (!onLyBlog || Object.keys(onLyBlog).length <= 0) {
                console.log("blog da bi xoa");
                return 0
            }
            const newCmt = await new Cmt({
                text : data.text,
                userId : data.currentUserId,
                idPOST : data.idBlog
            })
            
            await newCmt.save()
            const blog = await Blog.findByIdAndUpdate({_id : data.idBlog}, { $addToSet : { comment : newCmt._id }})
            const dataTrue = await VIDEOANDPOST.findOneAndUpdate({ idCateGory : data.idBlog}, {
                $addToSet : {
                    comment : newCmt._id
                }
            })
            
            const dataFake = {
                _id : data.idBlog,
                text : data.text,
                userId : {
                    fullName : data.currentUserFullName,
                    avatar : data.currentUserAvatar
                },
            }
            io.sockets.to(data.idBlog).emit("sever_return_comment", dataFake)
        } catch (error) {
            console.log(error);
        }
    }) // done //

    socket.on("user_comment_video", async(data) => {
        console.log(data);
        try {
            socket.join(data.idVideo)
            const newCmt = await new Cmt({
                text : data.text,
                userId : data.currentUserId,
                idPOST : data.idVideo
            })
            
            await newCmt.save()
            await Video.findByIdAndUpdate({_id : data.idVideo}, { $addToSet : { comment : newCmt._id }})
            await VIDEOANDPOST.findOneAndUpdate({ idCateGory : data.idVideo}, { $addToSet : { comment : newCmt._id }})
            
            const dataFake = {
                text : data.text,
                userId : {
                    fullName : data.currentUserFullName,
                    avatar : data.currentUserAvatar
                },
            }
            io.sockets.to(data.idVideo).emit("sever_return_comment_video", dataFake)
            
        } catch (error) {
            console.log(error)
        }
    })
    socket.on("remove_comment", async(data) => {
        try {
            if (data.id) {
                const onlyBlog = await Blog.findOne({_id : data.idBlog}).populate("comment", "userId")
                const dataComment = onlyBlog.comment
                const result = dataComment.some((el) => {
                    return el.userId.toString() === data.currentUserId && el._id.toString() === data.id
                })

                    if (result || socket.role === "admin") {
                        await Cmt.findByIdAndDelete({_id : data.id})
                        await Blog.findByIdAndUpdate({_id : data.idBlog}, { $pull : { comment : data.id} })
                        await VIDEOANDPOST.findOneAndUpdate({ idCateGory : data.idBlog}, {
                            $pull : {
                                comment : data.id
                            }
                        })
                        socket.emit("remove_comment_success", data.id)
                        return 1
                    }else {
                        console.log("bạn không thể xóa tin nhắn này");
                        return 0
                    }
            }else {
                console.log("tin nhắn vừa gửi chưa thể xóa ngay vui lòng reload lại");
                return 0
            }
        } catch (error) {
            console.log(error);
        }

    }) // da xong den day

    socket.on("user_remove_message", async(data) => {
        console.log(data.idRoom);
        try {
            if (data.id) {
                const OnlyRoom = await Rooms.findOne({_id : data.idRoom}).populate("messages", "userId")
                const dataMess = OnlyRoom.messages
                const result = dataMess.some((el) => {
                    return el.userId.toString() === data.currentUserId && el._id.toString() === data.id
                })

                    if (result || OnlyRoom.createBy.includes(data.currentUserId.userId)) {
                        socket.join(data.idRoom)
                        await Mess.findByIdAndDelete({_id : data.id})
                        await Rooms.findByIdAndUpdate({_id : data.idRoom}, { $pull : { messages : data.id} })
                        io.sockets.in(data.idRoom).emit("remove_message_success", data.id)
                        return 1
                    }else {
                        console.log("ban khong the xoa message nay");
                    }
            }else {
                console.log("tin nhắn vừa gửi chưa thể xóa ngay vui lòng reload lại");
            }
        } catch (error) {
            console.log(error);
        }
    })

    // socket.on("remove_comment_video", async(data) => {
    //     try {
    //         if (data.id) {
    //             const onlyVideo = await Video.findOne({_id : data.idVideo}).populate("comment", "userId")
    //             const dataComment = onlyVideo.comment
    //             const result = dataComment.some((el) => {
    //                 return el.userId.toString() === socket.userId && el._id.toString() === data.id
    //             })
    //             if (result || socket.role === "admin") {
    //                     await Cmt.findByIdAndDelete({_id : data.id})
    //                     await Video.findByIdAndUpdate({_id : data.idVideo}, { $pull : { comment : data.id} })
    //                     socket.emit("remove_comment_video_success", data.id)
    //                     return 1
    //                 }else {
    //                     console.log("bạn không thể xóa comment này");
    //                     return 0
    //                 }
    //         }else {
    //             console.log("tin nhắn vừa gửi chưa thể xóa ngay vui lòng reload lại");
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }

    // }) chua xong
    socket.on("disconnect", async() => {
        // await User.findByIdAndUpdate({ _id : socket.userId }, {$set : { isActive : false }})
        // await User.findByIdAndUpdate({ _id : socket.userId }, {$set : { sorts : 0 }})
            for (let i of socket.rooms) {
                socket.leave(i)
            }
        // console.log("user-----------------" + socket.username + "----------------disconnect");
    })
})




