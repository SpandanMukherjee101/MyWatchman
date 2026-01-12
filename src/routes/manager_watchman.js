const wm= require("../controllers/managerWatchmanController")
const {
  getCurrentLocation,
  getSteps
} = require("../controllers/managerController");

const express= require("express")
let manager_wm= express.Router()

manager_wm.get("/currentlocation", getCurrentLocation);
manager_wm.get("/steps/:sid", getSteps);

manager_wm.use('/shift', require('./watchman_utilities'))
manager_wm.post("/", wm.add)
manager_wm.get("/", wm.list)
manager_wm.get("/:watchmanId", wm.get)
manager_wm.put("/:watchmanId", wm.up)
manager_wm.delete("/:watchmanId", wm.del)

module.exports= manager_wm;