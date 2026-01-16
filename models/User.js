const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
            },
            message: props => `${props.value} 不是有效的邮箱地址！`
        }
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    specialties: [
        {
            type: String,
            trim: true
        }
    ],
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    avatar: {
        type: String,
        default: 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    userType: {
        type: String,
        enum: ['creator', 'enthusiast'],
        default: 'creator'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    subscription: {
        type: String,
        enum: ['free', 'premium', 'professional'],
        default: 'free'
    },
    usage: {
        generations: {
            type: Number,
            default: 0
        },
        storage: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: Date.now
        }
    }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 密码比较方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);