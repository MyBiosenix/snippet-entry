const express = require('express');
const router = express.Router();

const { login, getDashStats, getMyUsers,getActiveUsers,getInActiveUsers } = require('../controllers/subadminController');
const {protectAdmin} = require('../middleware/protectAdmin');

router.post('/login',login)
router.get('/stats',protectAdmin,getDashStats);
router.get('/getusers',protectAdmin,getMyUsers);
router.get('/active-users',protectAdmin,getActiveUsers);
router.get('/inactive-users',protectAdmin,getInActiveUsers);

module.exports = router;