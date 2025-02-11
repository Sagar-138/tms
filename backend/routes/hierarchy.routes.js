const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const hierarchyController = require('../controllers/hierarchy.controller');

router.post('/',  authorize('company_admin'), hierarchyController.createHierarchyLevel);
router.get('/',  hierarchyController.getCompanyHierarchy);
router.put('/:id',  authorize('company_admin'), hierarchyController.updateHierarchyLevel);

module.exports = router;