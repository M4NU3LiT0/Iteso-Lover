const express = require('express');
const { blockUser, unblockUser, reportUser } = require('../controllers/block.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/:id/block', blockUser);
router.delete('/:id/block', unblockUser);
router.post('/:id/report', reportUser);

module.exports = router;
