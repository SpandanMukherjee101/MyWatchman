const wuc= require("../controllers/watchmanUtilsController")

const express= require("express")
let wu= express.Router()

wu.post("/", require('../middleware/checkManager'), wuc.add)
wu.get("/:wid", require('../middleware/checkManager'), wuc.list)
wu.delete('/', require('../middleware/checkManager'), wuc.del)

module.exports= wu;