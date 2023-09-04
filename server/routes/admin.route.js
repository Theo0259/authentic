const router = require("express").Router();
const adminController = require("../controllers/admin.controller");

//Register a new user
router.post("/register", adminController.register);

 //Login user
router.post("/login", adminController.login);

// //Dashboard
// router.get("/dashboard", adminController.dashBoard);

module.exports = router;