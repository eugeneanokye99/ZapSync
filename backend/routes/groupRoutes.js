const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const {singleUpload} = require('../middleware/uploadMiddleware');


// Get groups available to join
router.get('/available', protect, groupController.getAvailableGroups);

// Join group with token
router.post(':id/join', protect, groupController.joinWithToken);

// Staff routes
router.get('/staff', protect, groupController.getStaffGroups);
router.post('/', protect, groupController.createGroup);
router.put('/:id', protect, groupController.updateGroup);
router.delete('/:id', protect, groupController.deleteGroup);
router.post('/:id/files', protect, singleUpload.single('file'), groupController.uploadGroupFile);
router.delete('/:groupId/files/:fileId', protect, groupController.deleteGroupFile);
router.post('/:id/token', protect, groupController.generateJoinToken);
router.get('/user', protect, groupController.getUserGroups);

module.exports = router;