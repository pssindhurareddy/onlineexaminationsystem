const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole(['admin']));

router.get('/users', AdminController.getAllUsers);
router.post('/users/bulk', AdminController.bulkProvisionIdentities);
router.get('/users/pending-requests', AdminController.getPendingRequests);
router.patch('/users/:id/approve', AdminController.approveRequest);
router.patch('/users/:id/toggle', AdminController.toggleUserStatus);
router.get('/stats', AdminController.getDashboardStats);

module.exports = router;
