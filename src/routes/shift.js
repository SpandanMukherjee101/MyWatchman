const shift= require("../controllers/shiftController.js")

const express= require("express")
let s= express.Router()

s.post("/", shift.add)
s.get("/", shift.list)
s.get("/:id", shift.get)
s.put("/:id", shift.up)
s.delete("/:id", shift.del)

module.exports= s;