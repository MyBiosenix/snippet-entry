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

router.get("/next/:userId",authMiddleware, getNextSnippet);

router.post('/submit',authMiddleware, submitSnippet);

router.get('/results/:userId', getUserResults);

router.patch('/toggle/:userId/:errorId', toggleVisibility);

router.patch('/update/:userId/:errorId', updateSnippetErrors);

router.get('/user-visible/:userId', getVisibleUserResults);

router.patch("/edit-text/:userId/:errorId", editUserText);

router.get('/user/:userId', showUser);



module.exports = router;
