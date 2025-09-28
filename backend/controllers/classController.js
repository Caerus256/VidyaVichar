const Class = require('../models/Class');
const Question = require('../models/Question');
const mongoose = require('mongoose'); // Add this import

// Create a new class (teachers only)
const createClass = async (req, res) => {
  try {
    const { name, description, subject } = req.body;
    
    // Check if user is teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classes' });
    }

    // Validate inputs
    if (!name || !description || !subject) {
      return res.status(400).json({ message: 'Name, description, and subject are required' });
    }
    
    // Check for duplicate class name (case-insensitive)
    const existing = await Class.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });
    
    if (existing) {
      return res.status(400).json({ message: 'A class with this name already exists' });
    }

    const newClass = await Class.create({
      name: name.trim(),
      description: description.trim(),
      subject: subject.trim(),
      createdBy: req.user._id,
      createdByName: req.user.name,
      totalQuestions: 0,
      activeQuestions: 0
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all active classes
const getClasses = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = { isActive: true };
    
    // Add search functionality
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    
    const classes = await Class.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name role')
      .lean(); // Use lean for better performance
    
    // Add real-time question counts
    const classesWithStats = await Promise.all(
      classes.map(async (classData) => {
        const totalQuestions = await Question.countDocuments({ classId: classData._id });
        const activeQuestions = await Question.countDocuments({ 
          classId: classData._id, 
          deleted: { $ne: true } 
        });
        
        return {
          ...classData,
          totalQuestions,
          activeQuestions
        };
      })
    );
      
    res.json(classesWithStats);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific class by ID
const getClassById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const classData = await Class.findById(req.params.id)
      .populate('createdBy', 'name role');
      
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!classData.isActive) {
      return res.status(404).json({ message: 'Class is not active' });
    }
    
    // Get class statistics
    const totalQuestions = await Question.countDocuments({ classId: classData._id });
    const activeQuestions = await Question.countDocuments({ 
      classId: classData._id, 
      deleted: { $ne: true } 
    });
    
    // Update class stats in background (optional)
    Class.findByIdAndUpdate(classData._id, {
      totalQuestions,
      activeQuestions
    }).exec(); // Don't wait for this
    
    res.json({
      ...classData.toObject(),
      totalQuestions,
      activeQuestions
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update class (teachers only - only creator can update)
const updateClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is the creator or a teacher
    if (req.user.role !== 'teacher' || classData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the class creator can update this class' });
    }

    // Validate required fields if they're being updated
    const updates = {};
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) {
        return res.status(400).json({ message: 'Class name cannot be empty' });
      }
      // Check for duplicate name (excluding current class)
      const existing = await Class.findOne({ 
        name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') },
        isActive: true,
        _id: { $ne: req.params.id }
      });
      
      if (existing) {
        return res.status(400).json({ message: 'A class with this name already exists' });
      }
      updates.name = req.body.name.trim();
    }
    
    if (req.body.description !== undefined) {
      if (!req.body.description.trim()) {
        return res.status(400).json({ message: 'Description cannot be empty' });
      }
      updates.description = req.body.description.trim();
    }
    
    if (req.body.subject !== undefined) {
      if (!req.body.subject.trim()) {
        return res.status(400).json({ message: 'Subject cannot be empty' });
      }
      updates.subject = req.body.subject.trim();
    }
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json(updatedClass);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Deactivate class (soft delete - teachers only)
const deactivateClass = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is the creator
    if (req.user.role !== 'teacher' || classData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the class creator can deactivate this class' });
    }
    
    const deactivatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.json({ message: 'Class deactivated successfully', class: deactivatedClass });
  } catch (error) {
    console.error('Deactivate class error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get classes created by the current user (teachers only)
const getMyClasses = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this endpoint' });
    }
    
    const classes = await Class.find({ 
      createdBy: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });
    
    // Add question counts for each class
    const classesWithStats = await Promise.all(
      classes.map(async (classData) => {
        const totalQuestions = await Question.countDocuments({ classId: classData._id });
        const activeQuestions = await Question.countDocuments({ 
          classId: classData._id, 
          deleted: { $ne: true } 
        });
        
        return {
          ...classData.toObject(),
          totalQuestions,
          activeQuestions
        };
      })
    );
    
    res.json(classesWithStats);
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createClass, 
  getClasses, 
  getClassById, 
  updateClass, 
  deactivateClass,
  getMyClasses
};