const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  // Stats for quick access
  totalQuestions: { type: Number, default: 0 },
  activeQuestions: { type: Number, default: 0 }
}, { timestamps: true });

// Index for better search performance
classSchema.index({ name: 'text', subject: 'text', description: 'text' });

module.exports = mongoose.model('Class', classSchema);