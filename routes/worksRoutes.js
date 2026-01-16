const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/authUtils');
const Work = require('../models/Work');

// 获取作品列表
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, style, sortBy = 'createdAt', order = 'desc' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = { isPublic: true };
        if (style) query.style = style;
        
        const sort = {};
        sort[sortBy] = order === 'asc' ? 1 : -1;
        
        const works = await Work.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('creator', 'username avatar')
            .populate('likes', '_id');
        
        const total = await Work.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                works,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取作品列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取作品列表失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取作品详情
router.get('/:id', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id)
            .populate('creator', 'username avatar')
            .populate('likes', 'username avatar');
        
        if (!work) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }
        
        // 增加浏览量
        work.views += 1;
        await work.save();
        
        res.json({
            success: true,
            data: work
        });
    } catch (error) {
        console.error('获取作品详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取作品详情失败，请稍后重试',
            error: error.message
        });
    }
});

// 更新作品信息
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, tags, isPublic } = req.body;
        
        const work = await Work.findById(req.params.id);
        
        if (!work) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }
        
        // 检查是否是作品的创建者
        if (work.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: '无权修改此作品'
            });
        }
        
        // 更新作品信息
        if (title) work.title = title;
        if (description) work.description = description;
        if (tags) work.tags = tags;
        if (isPublic !== undefined) work.isPublic = isPublic;
        
        await work.save();
        
        res.json({
            success: true,
            message: '作品更新成功',
            data: work
        });
    } catch (error) {
        console.error('更新作品失败:', error);
        res.status(500).json({
            success: false,
            message: '更新作品失败，请稍后重试',
            error: error.message
        });
    }
});

// 删除作品
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        
        if (!work) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }
        
        // 检查是否是作品的创建者
        if (work.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: '无权删除此作品'
            });
        }
        
        await work.deleteOne();
        
        res.json({
            success: true,
            message: '作品删除成功'
        });
    } catch (error) {
        console.error('删除作品失败:', error);
        res.status(500).json({
            success: false,
            message: '删除作品失败，请稍后重试',
            error: error.message
        });
    }
});

// 点赞作品
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        
        if (!work) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }
        
        // 检查用户是否已经点赞
        const isLiked = work.likes.some(like => like.toString() === req.user._id.toString());
        
        if (isLiked) {
            // 取消点赞
            work.likes = work.likes.filter(like => like.toString() !== req.user._id.toString());
            await work.save();
            
            res.json({
                success: true,
                message: '取消点赞成功',
                data: {
                    likesCount: work.likes.length
                }
            });
        } else {
            // 点赞
            work.likes.push(req.user._id);
            await work.save();
            
            res.json({
                success: true,
                message: '点赞成功',
                data: {
                    likesCount: work.likes.length
                }
            });
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({
            success: false,
            message: '点赞操作失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取热门作品
router.get('/popular/top', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const works = await Work.find({ isPublic: true })
            .sort({ likes: -1, views: -1 })
            .limit(parseInt(limit))
            .populate('creator', 'username avatar')
            .populate('likes', '_id');
        
        res.json({
            success: true,
            data: works
        });
    } catch (error) {
        console.error('获取热门作品失败:', error);
        res.status(500).json({
            success: false,
            message: '获取热门作品失败，请稍后重试',
            error: error.message
        });
    }
});

module.exports = router;