const express = require('express');
const router = express.Router();

const { createPackage,getpackages,getpackagesNames,editpackages,deletepackages } = require('../controllers/packageController');

router.post('/create-package',createPackage);
router.get('/all-packages',getpackages);
router.get('/package-names',getpackagesNames);
router.put('/:id/edit-package',editpackages);
router.delete('/:id/delete-package',deletepackages);

module.exports = router;
