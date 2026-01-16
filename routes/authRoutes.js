const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../utils/authUtils');

// 注册路由
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, userType } = req.body;
        
        // 检查用户是否已存在
        const userExists = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: '用户已存在'
            });
        }
        
        // 创建新用户
        const user = new User({
            username,
            email,
            password,
            userType
        });
        
        await user.save();
        
        // 生成token
        const token = generateToken(user._id);
        
        // 不返回密码等敏感信息
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            userType: user.userType,
            subscription: user.subscription
        };
        
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试',
            error: error.message
        });
    }
});

// 登录路由
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 查找用户并包含密码字段
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        
        // 更新最后登录时间
        user.lastLogin = Date.now();
        await user.save();
        
        // 生成token
        const token = generateToken(user._id);
        
        // 不返回密码等敏感信息
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            userType: user.userType,
            subscription: user.subscription
        };
        
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试',
            error: error.message
        });
    }
});

// 登出路由
router.post('/logout', authMiddleware, (req, res) => {
    try {
        // 在客户端清除token
        res.json({
            success: true,
            message: '登出成功'
        });
    } catch (error) {
        console.error('登出失败:', error);
        res.status(500).json({
            success: false,
            message: '登出失败，请稍后重试',
            error: error.message
        });
    }
});

// 验证token有效性
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        // 重新查询用户，确保获取完整信息
        const user = await User.findById(req.user._id).select('-password');
        
        // 不返回密码等敏感信息，包括新添加的bio和specialties字段
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            userType: user.userType,
            subscription: user.subscription,
            bio: user.bio,
            specialties: user.specialties
        };
        
        res.json({
            success: true,
            data: {
                user: userData
            }
        });
    } catch (error) {
        console.error('验证token失败:', error);
        res.status(401).json({
            success: false,
            message: 'token无效或已过期'
        });
    }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // 重新查询用户，确保获取完整信息
        const user = await User.findById(req.user._id).select('-password');
        
        // 不返回密码等敏感信息，包括新添加的bio和specialties字段
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            userType: user.userType,
            subscription: user.subscription,
            usage: user.usage,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            bio: user.bio,
            specialties: user.specialties
        };
        
        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败，请稍后重试',
            error: error.message
        });
    }
});

module.exports = router;