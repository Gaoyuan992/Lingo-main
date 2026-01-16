const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../utils/authUtils');
const { handleAvatarUpload, getFileUrl } = require('../utils/uploadUtils');

// 上传用户头像
router.post('/avatar', authMiddleware, handleAvatarUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的头像文件'
            });
        }
        
        const avatarUrl = getFileUrl(req, req.file.path);
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatarUrl },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: '头像上传成功',
            data: updatedUser
        });
    } catch (error) {
        console.error('头像上传失败:', error);
        res.status(500).json({
            success: false,
            message: '头像上传失败，请稍后重试',
            error: error.message
        });
    }
});

// 更新用户信息
router.put('/update', authMiddleware, async (req, res) => {
    try {
        const { username, avatar, bio, specialties } = req.body;
        const updates = {};
        
        if (username) updates.username = username;
        if (avatar) updates.avatar = avatar;
        if (bio !== undefined) updates.bio = bio;
        if (specialties) updates.specialties = specialties;
        
        // 检查用户名是否已被使用
        if (username) {
            const userExists = await User.findOne({
                username,
                _id: { $ne: req.user._id }
            });
            
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已被使用'
                });
            }
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: '用户信息更新成功',
            data: updatedUser
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户信息失败，请稍后重试',
            error: error.message
        });
    }
});

// 修改密码
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 验证当前密码
        const user = await User.findById(req.user._id).select('+password');
        
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }
        
        // 更新密码
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取用户使用统计
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('usage');
        
        res.json({
            success: true,
            data: user.usage
        });
    } catch (error) {
        console.error('获取使用统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取使用统计失败，请稍后重试',
            error: error.message
        });
    }
});

// 更新用户订阅
router.put('/subscription', authMiddleware, async (req, res) => {
    try {
        const { subscription } = req.body;
        
        // 验证订阅类型
        const validSubscriptions = ['free', 'premium', 'professional'];
        if (!validSubscriptions.includes(subscription)) {
            return res.status(400).json({
                success: false,
                message: '无效的订阅类型'
            });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { subscription },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: '订阅更新成功',
            data: updatedUser
        });
    } catch (error) {
        console.error('更新订阅失败:', error);
        res.status(500).json({
            success: false,
            message: '更新订阅失败，请稍后重试',
            error: error.message
        });
    }
});

module.exports = router;