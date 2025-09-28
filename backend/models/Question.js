const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  className: { type: String, required: true },
  status: { type: String, enum: ['pending', 'answered', 'important'], default: 'pending' },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

questionSchema.index({ classId: 1, deleted: 1, status: 1 });
questionSchema.index({ classId: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);