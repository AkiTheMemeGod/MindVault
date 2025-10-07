import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documents: [{
    fileName: String,
    originalName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    type: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    sources: [{
      fileName: String,
      pageNumber: Number,
      text: String,
      similarity: Number
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'paused'],
    default: 'active'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update lastActivity on message addition
studySessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.totalMessages = this.messages.length;
  }
  next();
});

const StudySession = mongoose.model("StudySession", studySessionSchema);

export default StudySession;