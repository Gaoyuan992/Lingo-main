const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    style: {
        type: String,
        enum: ['traditional', 'modern', 'ink', 'minimalist', 'abstract', 'other'],
        default: 'traditional'
    },
    model: {
        type: String,
        default: 'default'
    },
    parameters: {
        type: Object,
        default: {}
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 更新时间中间件
workSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// 虚拟字段：点赞数量
workSchema.virtual('likesCount').get(function() {
    return this.likes.length;
});

module.exports = mongoose.model('Work', workSchema);