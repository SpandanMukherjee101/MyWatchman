const building= require("../controllers/buildingShiftController")

const express= require("express")
let b= express.Router({ mergeParams: true });

b.get("/", building.list)
b.post("/", building.add)
b.get("/:sid", building.get)
b.put("/:sid", building.up)
b.delete("/:sid", building.del)

module.exports= b;