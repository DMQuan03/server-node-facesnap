const { default : mongoose } = require("mongoose")

// cấu hình db
const dbConnect = (async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        if(conn.connection.readyState === 1) console.log("DB connect successfully")
        else console.log("DB connecting")
    } catch (error) {
        console.error("DB connect fail")
        throw new Error("Err from server")
    }
})

module.exports = dbConnect