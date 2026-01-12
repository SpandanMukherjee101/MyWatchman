watchman = require("../controllers/visitorController.js");

const express = require("express");

const routes = express.Router();

routes.get("/logvisitor/:bid", watchman.getBuildingVisitorLogs);
routes.get("/entry/:vid", watchman.getVisitorBuildings);
routes.get("/visitor/:bid", watchman.getVisitorsForBuilding);
routes.post("/logvisitor", watchman.logVisitor);
routes.put("/logvisitor/:visitorId", watchman.updateVisitorLog);

module.exports= routes;