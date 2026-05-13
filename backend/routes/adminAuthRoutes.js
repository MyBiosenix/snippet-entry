const express = require('express');
const router = express.Router();
const { login,createAdmin,getAdmin,getAdminName,deleteAdmin, editAdmin,changePassword,getAdminStats } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/protectAdmin');

router.post('/login',login);
router.post('/create-admin', protectAdmin, createAdmin);
router.get('/all-admins',protectAdmin,getAdmin);
router.get('/adminnames',protectAdmin,getAdminName);
router.delete('/:id/delete', protectAdmin, deleteAdmin);
router.put('/:id/edit-admin', protectAdmin, editAdmin);
router.put('/:id/change-password', protectAdmin, changePassword);
router.get('/dash-stats',protectAdmin,getAdminStats)

module.exports = router;
