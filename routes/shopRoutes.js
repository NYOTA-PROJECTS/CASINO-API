const express = require('express');
const shopController = require('../controllers/shopController');
const router = express.Router();

router.post('/create', shopController.createShop);
router.put('/update', shopController.updateShop);
router.delete('/delete', shopController.deleteShop);
router.get('/listAll', shopController.allShop);

module.exports = router;