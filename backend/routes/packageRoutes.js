const express = require('express');
const router = express.Router();

const { createPackage,getpackages,getpackagesNames,editpackages,deletepackages } = require('../controllers/packageController');
const { protectAdmin } = require('../middleware/protectAdmin');

router.post('/create-package',protectAdmin,createPackage);
router.get('/all-packages',protectAdmin,getpackages);
router.get('/package-names',protectAdmin,getpackagesNames);
router.put('/:id/edit-package',protectAdmin,editpackages);
router.delete('/:id/delete-package',protectAdmin,deletepackages);

module.exports = router;
