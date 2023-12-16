const express = require("express");
const caisseController = require("../controllers/caisseController");
const caisseTokenMiddleware = require("../middlewares/caisseTokenMiddleware");
const adminTokenMiddleware = require("../middlewares/adminTokenMiddleware");
const router = express.Router();

router.post("/create", adminTokenMiddleware, caisseController.createCaisse);
router.post("/login", caisseController.loginCaisse);

module.exports = router;