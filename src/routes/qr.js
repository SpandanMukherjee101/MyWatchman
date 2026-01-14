const qrController = require("../controllers/qrController");

const express = require("express");

const routes = express.Router();

routes.post('/details', qrController.details);
routes.post('/generate', qrController.generate);

routes.get('/details', qrController.detailsList);
routes.get('/generate', qrController.generatedList);
module.exports= routes;