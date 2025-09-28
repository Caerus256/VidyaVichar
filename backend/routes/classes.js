const express = require('express');
const { 
  createClass, 
  getClasses, 
  getClassById, 
  updateClass, 
  deactivateClass,
  getMyClasses
} = require('../controllers/classController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes (authenticated users can view all classes)
router.get('/', auth, getClasses);
router.get('/my-classes', auth, getMyClasses);
router.get('/:id', auth, getClassById);

// Teacher-only routes
router.post('/', auth, createClass);
router.put('/:id', auth, updateClass);
router.delete('/:id', auth, deactivateClass);

module.exports = router;