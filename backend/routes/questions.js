const express = require('express');
const { createQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createQuestion);
router.get('/', auth, getQuestions);
router.put('/:id', auth, updateQuestion);
router.delete('/:id', auth, deleteQuestion);

module.exports = router;