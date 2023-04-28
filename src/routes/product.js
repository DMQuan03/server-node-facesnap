const Router = require("express").Router()
const MIDDLEWARE = require("../middleware/jwt")
const ctrls = require("../controllers/product")

Router.post("/create", MIDDLEWARE.verifyToken , ctrls.createProduct  )
Router.get("/buy/:_id", MIDDLEWARE.verifyToken , ctrls.buyProduct)

module.exports = Router