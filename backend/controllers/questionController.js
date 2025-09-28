const Question = require('../models/Question');
const Class = require('../models/Class');
const mongoose = require('mongoose');

const createQuestion = async (req, res) => {
  try {
    const { text, classId } = req.body;
    
    // Validate inputs
    if (!text || !classId) {
      return res.status(400).json({ message: 'Question text and class ID are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    
    // Verify class exists and is active
    const classData = await Class.findById(classId);
    if (!classData || !classData.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive class' });
    }
    
    // Check for duplicate questions in the same class (only among non-deleted questions)
    const existing = await Question.findOne({ 
      text: text.trim(),
      classId: classId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Similar question already posted in this class' });
    }

    const question = await Question.create({
      text: text.trim(),
      author: req.user.name,
      authorId: req.user._id,
      classId: classId,
      className: classData.name,
      deleted: false,
    });

    // Update class question count - increment pending since new questions start as 'pending'
    await Class.findByIdAndUpdate(classId, {
      $inc: { totalQuestions: 1, pendingQuestions: 1 }
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getQuestions = async (req, res) => {
  try {
    const { status, includeDeleted, classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    
    let filter = { classId: classId };
    
    // Handle different filtering scenarios
    if (status === 'deleted') {
      filter.deleted = true;
    } else if (includeDeleted === 'true') {
      // Include all questions (deleted and non-deleted)
      // No additional filter needed
    } else if (status && status !== 'all') {
      // Specific status, exclude deleted
      filter.status = status;
      filter.deleted = { $ne: true };
    } else {
      // Default: exclude deleted questions
      filter.deleted = { $ne: true };
    }
    
    const questions = await Question.find(filter)
      .populate('classId', 'name subject')
      .sort({ createdAt: -1 });
      
    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID format' });
    }

    // Get the original question to check status change
    const originalQuestion = await Question.findById(req.params.id);
    if (!originalQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('classId', 'name subject');

    // Update class pending count if status changed
    if (req.body.status && req.body.status !== originalQuestion.status) {
      const oldStatus = originalQuestion.status;
      const newStatus = req.body.status;
      
      // Check if transition affects pending count
      const oldIsPending = ['pending', 'important'].includes(oldStatus);
      const newIsPending = ['pending', 'important'].includes(newStatus);
      
      if (oldIsPending && !newIsPending) {
        // Question moved from pending to non-pending (answered)
        await Class.findByIdAndUpdate(originalQuestion.classId, {
          $inc: { pendingQuestions: -1 }
        });
      } else if (!oldIsPending && newIsPending) {
        // Question moved from non-pending to pending
        await Class.findByIdAndUpdate(originalQuestion.classId, {
          $inc: { pendingQuestions: 1 }
        });
      }
    }
    
    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID format' });
    }

    // First, get the original question to preserve all its data
    const originalQuestion = await Question.findById(req.params.id);
    
    if (!originalQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Update only the deleted field, preserving all other data
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { deleted: true }
      },
      { new: true }
    ).populate('classId', 'name subject');

    // Update class pending count if the deleted question was pending
    if (!originalQuestion.deleted) {
      const wasPending = ['pending', 'important'].includes(originalQuestion.status);
      if (wasPending) {
        await Class.findByIdAndUpdate(originalQuestion.classId, {
          $inc: { pendingQuestions: -1 }
        });
      }
    }

    res.json({ message: 'Question marked as deleted', question });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get questions statistics for a specific class
const getClassQuestionStats = async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }
    
    // Use simpler aggregation without ObjectId constructor
    const stats = await Question.aggregate([
      { $match: { classId: new mongoose.Types.ObjectId(classId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'pending'] }, { $ne: ['$deleted', true] }] }, 
                1, 
                0
              ] 
            } 
          },
          answered: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'answered'] }, { $ne: ['$deleted', true] }] }, 
                1, 
                0
              ] 
            } 
          },
          important: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'important'] }, { $ne: ['$deleted', true] }] }, 
                1, 
                0
              ] 
            } 
          },
          deleted: { 
            $sum: { 
              $cond: [{ $eq: ['$deleted', true] }, 1, 0] 
            } 
          },
          pendingTotal: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $in: ['$status', ['pending', 'important']] }, 
                    { $ne: ['$deleted', true] }
                  ] 
                }, 
                1, 
                0
              ] 
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || { total: 0, pending: 0, answered: 0, important: 0, deleted: 0, pendingTotal: 0 };
    res.json(result);
  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createQuestion, 
  getQuestions, 
  updateQuestion, 
  deleteQuestion, 
  getClassQuestionStats 
};