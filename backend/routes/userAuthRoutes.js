const express = require("express");
const router = express.Router();

const { createUser,getUsers,login,logout,activateUser,deactivateUser,deleteUser, getActiveUsers,getInActiveUsers, editUser,changePassword,getUser,fetchStats } = require('../controllers/userAuthController');

const { checkActiveUser } = require('../middleware/checkActiveUser');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-user',createUser);
router.post('/login',login);
router.post('/logout',authMiddleware,logout)
router.get('/all-users',getUsers);
router.put('/:id/activate',activateUser);
router.put('/:id/deactivate',deactivateUser);
router.get('/active-users',getActiveUsers);
router.get('/inactive-users',getInActiveUsers);
router.delete('/:id/delete',deleteUser);
router.put('/:id/edit-user',editUser);
router.put('/:id/change-password',changePassword);
router.get('/:id/user',getUser);
router.get('/:id/dash-stats',authMiddleware, fetchStats);
router.get('/verify/:userId', authMiddleware, async (req, res) => {
  try {
    // if verifyToken middleware passes, token is valid
    return res.json({ valid: true });
  } catch (err) {
    return res.status(401).json({ valid: false });
  }
});


router.get('/check-auth',authMiddleware,checkActiveUser,(req,res) => {
    res.json({ active: true });
})

module.exports = router;