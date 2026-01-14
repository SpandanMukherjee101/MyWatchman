const wm= require("../controllers/watchmanController")

const express = require("express");

const routes = express.Router();

routes.use('/building', require('./wm_visitor'))
routes.use('/activity', require('./wm_activity'))

routes.put('/updateprofile', wm.up)
routes.get('/getshift', wm.gets)
routes.get("/building", wm.getb)
routes.get ('/area', wm.geta)

routes.post('/qrscan', wm.scan);

module.exports= routes;