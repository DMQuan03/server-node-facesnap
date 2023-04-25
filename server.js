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


db()
appRouter(app)


const server = app.listen(PORT , () => {
    console.log(`http://localhost:${PORT}`)
})

const io = socket(server, {
    cors : {
        origin : "http://localhost:3000",
        credentials : true,
    }
})

global.onlineUser = new Map()

io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) { return 0}
            socket.decoded = decoded;
            next();
        });
    }
    else {
        next(new Error('Authentication error'));
        return 2
    }
})



io.on("connection", async(socket) => {
    // config user when connect to server
    socket.username = socket.decoded.fullName
    socket.avatarUser = socket.decoded.avatar
    socket.userId = socket.decoded._id
    socket.role = socket.decoded.role
    socket.join(socket.decoded._id)
    await User.findByIdAndUpdate({ _id : socket.userId }, { $set : { isActive : true } })
    await User.findByIdAndUpdate({ _id : socket.userId }, { $set : { sorts : 1 } })

    socket.on("create_blog", async(data) => {
        console.log(data);
        const allUser = await User.findOne({_id : socket.userId})
        if (Object.keys(allUser).length >= 1) {
            const newBlog = await new Blog({
                title : data.title,
                img : data.img,
                userId : socket.userId
            })
            await newBlog.save()
            const blogFake = {
                _id : newBlog._id,
                title : data.title,
                img : data.img,
                userId : {
                    avatar : socket.avatarUser,
                    fullName : socket.username,
                    
                },
                likes : 0,
                shares : 0,
                comment : []
            }
            await User.findByIdAndUpdate({ _id : socket.userId }, { $set : { blog : newBlog._id } })
            socket.emit("return_blog", blogFake)
        }else {
            console.log("ban chua dang nhap");
        }
    })

    socket.on("send_req_to_user_add", async(data) => {

        try {
            const UserOnly =await User.findOne({_id : socket.userId})
            const result = UserOnly.listAwait.every((el) => {
                return el.toString() !== data._id
            })
            if (result) {
                socket.join(data.userId)
                    await User.updateOne({ _id : socket.userId }, { $addToSet : 
                        { addFriends : data.userId } 
                    }, {new : true})
                    await User.updateOne({ _id : data.userId }, { $addToSet : 
                        { listAwait : socket.userId } 
                    }, {new : true})
                    if (!UserOnly.following.includes(data.userId)) {
                        await User.updateOne({ _id : socket.userId }, { $addToSet : {  following : data.userId } })
                        await User.updateOne({_id : data.userId }, { $inc : {  followingOfUser : 1 } })
                        await User.updateOne({ _id : data.userId  }, { $addToSet : { otherFollowing : socket.userId } })
                    }
                    io.sockets.to(data.userId).emit("server_return_req_addFr", {
                        fullName : socket.username,
                        avatar : socket.avatarUser,
                        date : Date.now()
                    })
        
                socket.leave(data.userId)
            }else {
                console.log("bạn đã gửi lời mời kết bạn đến người này rồi");
                return 0
            }
        } catch (error) {
            throw new Error(error.message)
        }
    })

    socket.on("add_Friend", async(data) => {
        socket.join(data.userId)
            const UserOnly =await User.findOne({_id : data.userId})
            await User.updateOne({ _id : socket.userId }, { $addToSet : 
                { friends : data.userId } 
            }, {new : true})
            await User.updateOne({ _id : socket.userId }, { $pull : 
                { listAwait : data.userId } 
            }, {new : true})

            await User.updateOne({ _id : data.userId }, { $addToSet : 
                { friends : socket.userId } 
            }, {new : true})
            await User.updateOne({ _id : data.userId }, { $pull : 
                { addFriends : socket.userId } 
            }, {new : true})

            io.sockets.to(data.userId).emit("server_return_req_addFrOk", {
                fullName : socket.username,
                avatar : socket.avatarUser,
            })
            const allRooms = await Rooms.find()
            const lengthRooms = allRooms.length
            if (lengthRooms === 0) {
                const newRoom = await new Rooms({
                    user1 : socket.userId,
                    user2 : data.userId,
                    members : [
                        socket.userId,
                        data.userId
                    ],
                    createBy : [
                        socket.userId,
                        data.userId
                    ],
                    admin : [
                        socket.userId,
                        data.userId
                    ],
                    idCheck1 : socket.userId + data.userId,
                    idCheck2 : data.userId + socket.userId
                })
                await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
                await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
                await newRoom.save()
                console.log("success");
            }else {
                const checktrue = await socket.userId + data.userId
                const checktrue1 = await   data.userId + socket.userId
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
                            user1 : socket.userId,
                            user2 : data.userId,
                            members : [
                                socket.userId,
                                data.userId
                            ],
                            createBy : [
                                socket.userId,
                                data.userId
                            ],
                            admin : [
                                socket.userId,
                                data.userId
                            ],
                            idCheck1 : socket.userId + data.userId,
                            idCheck2 : data.userId + socket.userId
                        })
                        await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
                        await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
                        await newRoom.save()
                        console.log("success");
                    }else {
                        console.log("room da ton tai");
                    }
            }
            // }
            io.sockets.to(data.userId).emit("server_return_req_addFrOk", {
                fullName : socket.username,
                avatar : socket.avatarUser,
            })
            

        socket.leave(data.userId)
    })

    socket.on("user_send_mess_room_chat", async(data) => {
        try {
            const onLyRooms = await Rooms.findOne({ _id : data.RoomId })
            if (onLyRooms.blockChat.includes(socket.userId)) {
                console.log("you have been blocked from chatting");
                return 0
            }
            for (let i of socket.rooms) {
                socket.leave(i)
            }
            socket.join(data.RoomId)
            const newMess = await new Mess({
                text : data.text,
                userId : socket.userId,
                idRoom : data.RoomId
            })
            await newMess.save()
            await Rooms.findOneAndUpdate({_id : data.RoomId}, { $addToSet : { messages : newMess._id } })
            const fakeData = {
                text : data.text,
                userId : {
                    fullName : socket.username,
                    avatar : socket.avatarUser,
                    _id : socket.userId
                },
                idRoom : data.RoomId
            }
            io.sockets.to(data.RoomId).emit("user_send_mess_to_room", fakeData )
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

    socket.on("leave_room_blog", (data) => {
        console.log('leave room : ' + data.blogId);
        for (let i of socket.rooms) {
            socket.leave(i)
        }
        socket.leave(data.blogId)
    })

    socket.on("leave_room_video", (data) => {
        console.log("leave" + data.id);
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

    
    socket.on("leave_room_chat", (data) => {
        socket.leave(data.roomChat)
        console.log("user leave room :" + data.roomChat);
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

    socket.on("add_room", async(data) => {
        console.log(data);
        try {
            const allRooms = await Rooms.find()
            const lengthRooms = allRooms.length
            if (lengthRooms === 0) {
                const newRoom = await new Rooms({
                    user1 : socket.userId,
                    user2 : data.userId,
                    members : [
                        socket.userId,
                        data.userId
                    ],
                    createBy : [
                        socket.userId,
                        data.userId
                    ],
                    admin : [
                        socket.userId,
                        data.userId
                    ],
                    idCheck1 : socket.userId + data.userId,
                    idCheck2 : data.userId + socket.userId
                })
                await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
                await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
                await newRoom.save()
                console.log("success");
                return 1
            }else {
                const checktrue = await socket.userId + data.userId
                const checktrue1 = await   data.userId + socket.userId
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
                            user1 : socket.userId,
                            user2 : data.userId,
                            members : [
                                socket.userId,
                                data.userId
                            ],
                            createBy : [
                                socket.userId,
                                data.userId
                            ],
                            admin : [
                                socket.userId,
                                data.userId
                            ],
                            idCheck1 : socket.userId + data.userId,
                            idCheck2 : data.userId + socket.userId
                        })
                        await newRoom.save()
                        await User.findByIdAndUpdate({_id : socket.userId}, { $addToSet : { roomChats : newRoom._id } })
                        await User.findByIdAndUpdate({_id : data.userId}, { $addToSet : { roomChats : newRoom._id } })
                        socket.emit("add_room_success", newRoom)
                        return 1
                    }
            }
        } catch (error) {
            console.log(error);
            return 0
        }
    })

    socket.on("user_comment", async(data) => {
        socket.join(data.idBlog)
        const onLyBlog = await Blog.findOne({_id : data.idBlog})
        if (!onLyBlog || Object.keys(onLyBlog).length <= 0) {
            console.log("blog da bi xoa");
            return 0
        }
        const newCmt = await new Cmt({
            text : data.text,
            userId : socket.userId,
            idPOST : data.idBlog
        })
        
        await newCmt.save()
        const blog = await Blog.findByIdAndUpdate({_id : data.idBlog}, { $addToSet : { comment : newCmt._id }})
        
        const dataFake = {
            _id : data.idBlog,
            text : data.text,
            userId : {
                fullName : socket.username,
                avatar : socket.avatarUser
            },
        }
        console.log(data.idBlog);
        io.sockets.to(data.idBlog).emit("sever_return_comment", dataFake)
    })

    socket.on("user_comment_video", async(data) => {
        try {
            socket.join(data.idVideo)
            const newCmt = await new Cmt({
                text : data.text,
                userId : socket.userId,
                idPOST : data.idVideo
            })
            
            await newCmt.save()
            const video = await Video.findByIdAndUpdate({_id : data.idVideo}, { $addToSet : { comment : newCmt._id }})
            
            const dataFake = {
                text : data.text,
                userId : {
                    fullName : socket.username,
                    avatar : socket.avatarUser
                },
            }
            io.sockets.to(data.idVideo).emit("sever_return_comment_video", dataFake)
            
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("create_video", async(data) => {
        const user = await User.findOne({_id : socket.userId})
        if (!data.video) {
            console.log("you must send a video")
            return 0
        }
        if (Object.keys(user).length >= 1) {
            const newVideo = await new Video({
                title : data.title,
                video  : data.video,
                userId : socket.userId
            })
            await newVideo.save()
            const VideoFake = {
                title : data.title,
                video : data.video,
                userId : {
                    avatar : socket.avatarUser,
                    fullName : socket.username,
                    
                },
                likes : 0,
                shares : 0,
                views : 0
            }
            await User.findByIdAndUpdate({ _id : socket.userId }, { $addToSet : { videos : newVideo._id } })
            socket.emit("return_create_video_success", VideoFake)
        }else {
            console.log("ban chua dang nhap");
        }
    })

    socket.on("remove_comment", async(data) => {
        try {
            if (data.id) {
                const onlyBlog = await Blog.findOne({_id : data.idBlog}).populate("comment", "userId")
                const dataComment = onlyBlog.comment
                const result = dataComment.some((el) => {
                    return el.userId.toString() === socket.userId && el._id.toString() === data.id
                })

                    if (result || socket.role === "admin") {
                        await Cmt.findByIdAndDelete({_id : data.id})
                        await Blog.findByIdAndUpdate({_id : data.idBlog}, { $pull : { comment : data.id} })
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

    })

    socket.on("user_remove_message", async(data) => {
        try {
            if (data.id) {
                const OnlyRoom = await Rooms.findOne({_id : data.idRoom}).populate("messages", "userId")
                const dataMess = OnlyRoom.messages
                const result = dataMess.some((el) => {
                    return el.userId.toString() === socket.userId && el._id.toString() === data.id
                })

                    if (result || socket.role === "admin" || OnlyRoom.createBy.includes(socket.userId)) {
                        await Mess.findByIdAndDelete({_id : data.id})
                        await Rooms.findByIdAndUpdate({_id : data.idRoom}, { $pull : { messages : data.id} })
                        socket.emit("remove_message_success", data.id)
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

    socket.on("remove_comment_video", async(data) => {
        try {
            if (data.id) {
                const onlyVideo = await Video.findOne({_id : data.idVideo}).populate("comment", "userId")
                const dataComment = onlyVideo.comment
                const result = dataComment.some((el) => {
                    return el.userId.toString() === socket.userId && el._id.toString() === data.id
                })
                if (result || socket.role === "admin") {
                        await Cmt.findByIdAndDelete({_id : data.id})
                        await Video.findByIdAndUpdate({_id : data.idVideo}, { $pull : { comment : data.id} })
                        socket.emit("remove_comment_video_success", data.id)
                        return 1
                    }else {
                        console.log("bạn không thể xóa comment này");
                        return 0
                    }
            }else {
                console.log("tin nhắn vừa gửi chưa thể xóa ngay vui lòng reload lại");
            }
        } catch (error) {
            console.log(error);
        }

    })
    socket.on("disconnect", async() => {
        await User.findByIdAndUpdate({ _id : socket.userId }, {$set : { isActive : false }})
        await User.findByIdAndUpdate({ _id : socket.userId }, {$set : { sorts : 0 }})
            for (let i of socket.rooms) {
                socket.leave(i)
            }
            console.log(socket.rooms);
        console.log("user-----------------" + socket.username + "----------------disconnect");
    })
})




