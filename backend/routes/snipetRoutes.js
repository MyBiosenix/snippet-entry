const express = require('express');
const router = express.Router();

const {
  getNextSnippet,
  submitSnippet,
  getUserResults,
  toggleVisibility,
  getVisibleUserResults,
  updateSnippetErrors,
  showUser,
  editUserText,
  declareReport,
  undeclareReport
} = require('../controllers/snippetController');

const authMiddleware = require('../middleware/authMiddleware');
const { protectAdmin } = require('../middleware/protectAdmin');
const requireSelf = require('../middleware/requireSelf');

router.get("/next/:userId",authMiddleware, requireSelf, getNextSnippet);

router.post('/submit',authMiddleware, requireSelf, submitSnippet);

router.get('/results/:userId', protectAdmin, getUserResults);

router.patch('/toggle/:userId/:errorId', protectAdmin, toggleVisibility);

router.patch('/update/:userId/:errorId', protectAdmin, updateSnippetErrors);

router.get('/user-visible/:userId', authMiddleware, requireSelf, getVisibleUserResults);

router.patch("/edit-text/:userId/:errorId", protectAdmin, editUserText);

router.get('/user/:userId', authMiddleware, requireSelf, showUser);



module.exports = router;
