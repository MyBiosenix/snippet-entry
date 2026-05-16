const express = require("express");
const router = express.Router();

const { createUser,getUsers,login,logout,activateUser,deactivateUser,deleteUser, getActiveUsers,getInActiveUsers, editUser,changePassword,getUser,getUserForAdmin,fetchStats,getExpiringSoonUsers, targetsAchieved,addToDrafts,getDrafts,removeDrafts,declareResult,markUserComplete,markUserIncomplete,markSoftwareUsed,
  unmarkSoftwareUsed,
  markNotInSequence,
  unmarkNotInSequence,} = require('../controllers/userAuthController');

const { checkActiveUser } = require('../middleware/checkActiveUser');
const authMiddleware = require('../middleware/authMiddleware');
const { protectAdmin } = require('../middleware/protectAdmin');
const requireSelf = require('../middleware/requireSelf');

router.post('/create-user',protectAdmin,createUser);
router.post('/login',login);
router.post('/logout',authMiddleware,logout)
router.get('/all-users',protectAdmin,getUsers);
router.put('/:id/activate',protectAdmin,activateUser);
router.put('/:id/deactivate',protectAdmin,deactivateUser);
router.get('/active-users',protectAdmin,getActiveUsers);
router.get('/inactive-users',protectAdmin,getInActiveUsers);
router.delete('/:id/delete',protectAdmin,deleteUser);
router.put('/:id/edit-user',protectAdmin,editUser);
router.put('/:id/add-to-drafts',protectAdmin,addToDrafts);
router.put('/:id/remove-from-drafts',protectAdmin,removeDrafts);
router.get('/get-drafts',protectAdmin,getDrafts);
router.patch('/declare-result/:userId',protectAdmin,declareResult);
router.get('/admin/:userId/user', protectAdmin, getUserForAdmin);

router.put('/:id/mark-incomplete',protectAdmin,markUserIncomplete);
router.put('/:id/mark-complete',protectAdmin,markUserComplete);
router.put('/:id/mark-software-used', protectAdmin, markSoftwareUsed);
router.put('/:id/unmark-software-used', protectAdmin, unmarkSoftwareUsed);
router.put('/:id/mark-not-in-sequence', protectAdmin, markNotInSequence);
router.put('/:id/unmark-not-in-sequence', protectAdmin, unmarkNotInSequence);



router.put('/:id/change-password',authMiddleware,requireSelf,changePassword);
router.get('/:id/user',authMiddleware,requireSelf,getUser);
router.get('/:id/dash-stats',authMiddleware,requireSelf, fetchStats);
router.get('/verify/:userId', authMiddleware, requireSelf, async (req, res) => {
  try {
    return res.json({ valid: true });
  } catch (err) {
    return res.status(401).json({ valid: false });
  }
});

router.get('/expiring-soon',protectAdmin,getExpiringSoonUsers);
router.get('/targets-achieved',protectAdmin,targetsAchieved);

router.get('/check-auth',authMiddleware,checkActiveUser,(req,res) => {
    res.json({ active: true });
})


module.exports = router;
