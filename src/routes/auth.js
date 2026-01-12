const user= require("../controllers/authController")

const express= require("express")
let authRoute= express.Router()

authRoute.post("/manager/register", user.signup)
authRoute.post("/manager/login", user.login)
authRoute.post('/watchman/login', user.wmLogin)

module.exports= authRoute;