const building= require("../controllers/buildingController")

const express= require("express")
let b= express.Router()

b.post("/", building.add)
b.get("/", building.list)
b.get("/:id", building.get)
b.put("/:id", building.up)
b.delete("/:id", building.del)
b.use('/:id/shift', require('./building_shift'))

module.exports= b;