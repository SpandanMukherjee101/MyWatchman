const express = require("express");

const routes = express.Router();

routes.use('/auth', require('./auth'));
routes.use('/manager/watchman', require('../middleware/authMiddleware'), require('../middleware/checkRole'), require('./manager_watchman'))
routes.use('/manager/building', require('../middleware/authMiddleware'), require('../middleware/checkRole'), require('./building'))
routes.use('/manager/shift', require('../middleware/authMiddleware'), require('../middleware/checkRole'), require('./shift'))
routes.use('/manager/qr', require('../middleware/authMiddleware'), require('../middleware/checkRole'), require('./qr'))
routes.use('/watchman', require('../middleware/authMiddleware'), require('./watchman'))

module.exports= routes;