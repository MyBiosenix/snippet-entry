const express = require('express');
const router = express.Router();
const { login,createAdmin,getAdmin,getAdminName,deleteAdmin, editAdmin,changePassword,getAdminStats } = require('../controllers/adminAuthController');

router.post('/login',login);
router.post('/create-admin', createAdmin);
router.get('/all-admins',getAdmin);
router.get('/adminnames',getAdminName);
router.delete('/:id/delete', deleteAdmin);
router.put('/:id/edit-admin', editAdmin);
router.put('/:id/change-password', changePassword);
router.get('/dash-stats',getAdminStats)

module.exports = router;