const UserRouter = require("./user")
const BlogRouter = require("./blog")
const VideoRouter = require("./video")
const RoomRouter = require("./room")
const utilsRouter = require("./utils")

const AppRouter = (app) => {
    app.use("/api/user", UserRouter)
    app.use("/api/blog", BlogRouter)
    app.use("/api/video", VideoRouter)
    app.use("/api/room", RoomRouter)
    app.use("/api/utils", utilsRouter)
}

module.exports = AppRouter