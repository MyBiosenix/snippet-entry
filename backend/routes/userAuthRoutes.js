const express = require("express");
const router = express.Router();

const { createUser,getUsers,login,logout,activateUser,deactivateUser,deleteUser, getActiveUsers,getInActiveUsers, editUser,changePassword,getUser,fetchStats,getExpiringSoonUsers, targetsAchieved,addToDraft,getDraftUsers,removeFromDraft } = require('../controllers/userAuthController');

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

router.get('/expiring-soon',getExpiringSoonUsers);
router.get('/targets-achieved',targetsAchieved);

router.get('/check-auth',authMiddleware,checkActiveUser,(req,res) => {
    res.json({ active: true });
})

router.put('/:id/add-to-draft',authMiddleware,addToDraft);

router.put('/:id/remove-from-draft',authMiddleware,removeFromDraft);

router.get('/get-drafts',authMiddleware,getDraftUsers);

module.exports = router;