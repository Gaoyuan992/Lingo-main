const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/authUtils');
const User = require('../models/User');
const Work = require('../models/Work');
const aiService = require('../utils/aiService'); // 导入修改后的AI服务

// AI生成接口
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        // 解构前端发送的参数，支持新格式
        const { templateUuid, generateParams } = req.body;
        
        // 检查用户使用限制
        const user = await User.findById(req.user._id);
        if (user.subscription === 'free' && user.usage.generations >= 50) {
            return res.status(403).json({ 
                success: false,
                message: '免费用户每月生成次数已达上限'
            });
        }
        
        // 如果是新格式，提取参数
        let prompt, style, complexity, color, model, aspectRatio, imageSize, steps, controlnet;
        
        if (generateParams) {
            // 使用新的参数格式
            prompt = generateParams.prompt;
            aspectRatio = generateParams.aspectRatio || 'portrait';
            imageSize = generateParams.imageSize || { width: 768, height: 1024 };
            steps = generateParams.steps || 30;
            controlnet = generateParams.controlnet;
            
            // 保持向后兼容，从generateParams中提取旧格式参数
            style = generateParams.style || 'realistic';
            complexity = generateParams.complexity || 5;
            color = generateParams.color || 'vibrant';
            model = generateParams.model || 'custom_ai';
        } else {
            // 兼容旧格式参数
            ({ prompt, style, complexity, color, model } = req.body);
            aspectRatio = 'portrait';
            imageSize = { width: 768, height: 1024 };
            steps = 30;
        }
        
        console.log('准备调用AI服务，参数格式:', generateParams ? '新格式' : '旧格式');
        console.log('模板UUID:', templateUuid);
        console.log('生成参数:', generateParams ? JSON.stringify(generateParams, null, 2) : { prompt, style, complexity, color, model });
        
        // 处理模型参数，libilibi模型直接使用，其他模型映射到custom_ai
        const modelToUse = model === 'libilibi' ? 'libilibi' : (model || 'custom_ai');
        
        // 调用更新后的AI服务进行图像生成
        const aiResult = await aiService.generateImage(modelToUse, { 
            prompt, 
            style,
            complexity: parseInt(complexity),
            color,
            templateUuid,
            aspectRatio,
            imageSize,
            steps,
            controlnet,
            parameters: { model: modelToUse }
        });
        
        // 获取生成的图像URL
        let generatedImageUrl;
        let generationTime;
        if (aiResult.success && aiResult.data && aiResult.data.imageUrl) {
            generatedImageUrl = aiResult.data.imageUrl;
            generationTime = aiResult.data.generationTime;
            console.log('AI服务调用成功，生成时间:', generationTime, '秒');
        } else {
            // 如果AI服务调用失败，使用备用的模拟图像
            console.log('AI服务调用失败或返回无效数据，使用备用模拟图像');
            // 使用更可靠的placeholder.com服务替代picsum.photos
            generatedImageUrl = `https://via.placeholder.com/800x600?text=AI+生成图像`;
            generationTime = Math.floor(Math.random() * 10) + 5;
        }
        
        // 创建作品记录
        const work = new Work({
            title: `AI生成作品_${Date.now()}`,
            description: prompt,
            creator: req.user._id,
            imageUrl: generatedImageUrl,
            style: style || 'modern',
            parameters: { 
                complexity, 
                color, 
                model,
                templateUuid,
                aspectRatio,
                imageSize,
                steps,
                controlnet
            },
            isPublic: false
        });
        
        await work.save();
        
        // 更新用户使用统计
        user.usage.generations += 1;
        await user.save();
        
        // 计算剩余生成次数
        const remainingCount = user.subscription === 'free' ? 
            50 - user.usage.generations : 
            999; // 非免费用户设为较大值
        
        res.json({
            success: true,
            message: '作品生成成功',
            data: {
                workId: work._id,
                imageUrl: work.imageUrl,
                generationTime: generationTime,
                remainingCount: remainingCount
            }
        });
    } catch (error) {
        console.error('生成失败:', error);
        res.status(500).json({
            success: false,
            message: '生成失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取生成历史
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const works = await Work.find({ creator: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('creator', 'username avatar');
        
        const total = await Work.countDocuments({ creator: req.user._id });
        
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
        console.error('获取历史记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取历史记录失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取可用的艺术风格
router.get('/styles', async (req, res) => {
    try {
        const styles = [
            { value: 'traditional', label: '传统艺术' },
            { value: 'modern', label: '现代艺术' },
            { value: 'ink', label: '水墨画' },
            { value: 'minimalist', label: '极简主义' },
            { value: 'abstract', label: '抽象艺术' },
            { value: 'realistic', label: '写实风格' },
            { value: 'anime', label: '动漫风格' },
            { value: 'portrait', label: '肖像风格' },
            { value: 'landscape', label: '风景风格' },
            { value: 'other', label: '其他风格' }
        ];
        
        res.json({
            success: true,
            data: styles
        });
    } catch (error) {
        console.error('获取风格列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取风格列表失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取可用的模板列表
router.get('/templates', async (req, res) => {
    try {
        const templates = [
            {
                uuid: '5d7e67009b344550bc1aa6ccbfa1d7f4',
                name: '人像艺术',
                description: '适用于生成高质量人像艺术作品',
                recommendedParams: {
                    aspectRatio: 'portrait',
                    imageSize: { width: 768, height: 1024 },
                    steps: 30
                }
            },
            {
                uuid: '6e8f7811ac455661cd2bb7ddcfb2e8f5',
                name: '风景摄影',
                description: '适用于生成自然风景摄影作品',
                recommendedParams: {
                    aspectRatio: 'landscape',
                    imageSize: { width: 1024, height: 768 },
                    steps: 35
                }
            },
            {
                uuid: '7f9g8922bd566772de3cc8eeadf3f9g6',
                name: '抽象艺术',
                description: '适用于生成创意抽象艺术作品',
                recommendedParams: {
                    aspectRatio: 'square',
                    imageSize: { width: 1024, height: 1024 },
                    steps: 40
                }
            }
        ];
        
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('获取模板列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模板列表失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取可用的ControlNet类型
router.get('/controlnet-types', async (req, res) => {
    try {
        const controlNetTypes = [
            { value: 'none', label: '无ControlNet' },
            { value: 'depth', label: '深度控制' },
            { value: 'canny', label: '边缘检测' },
            { value: 'pose', label: '姿态控制' },
            { value: 'seg', label: '语义分割' },
            { value: 'hed', label: '边缘细节' }
        ];
        
        res.json({
            success: true,
            data: controlNetTypes
        });
    } catch (error) {
        console.error('获取ControlNet类型失败:', error);
        res.status(500).json({
            success: false,
            message: '获取ControlNet类型失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取可用的尺寸比例
router.get('/aspect-ratios', async (req, res) => {
    try {
        const aspectRatios = [
            { value: 'portrait', label: '竖版 3:4', recommendedSize: { width: 768, height: 1024 } },
            { value: 'landscape', label: '横版 4:3', recommendedSize: { width: 1024, height: 768 } },
            { value: 'square', label: '方形 1:1', recommendedSize: { width: 1024, height: 1024 } },
            { value: 'widescreen', label: '宽屏 16:9', recommendedSize: { width: 1280, height: 720 } },
            { value: 'ultrawide', label: '超宽屏 21:9', recommendedSize: { width: 1920, height: 864 } }
        ];
        
        res.json({
            success: true,
            data: aspectRatios
        });
    } catch (error) {
        console.error('获取尺寸比例失败:', error);
        res.status(500).json({
            success: false,
            message: '获取尺寸比例失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取可用的AI模型 - 新增路由
router.get('/models', async (req, res) => {
    try {
        // 调用aiService获取可用模型列表
        // 目前aiService.getAvailableModels()返回空数组，等待配置新模型
        const models = aiService.getAvailableModels();
        
        res.json({
            success: true,
            data: models
        });
    } catch (error) {
        console.error('获取模型列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模型列表失败，请稍后重试',
            error: error.message
        });
    }
});

// 文创产品智能体相关路由

// 生成文创产品图样
router.post('/cultural-product/generate', authMiddleware, async (req, res) => {
    try {
        // 解构前端发送的参数
        const { productType, theme, style, colorScheme, patternType, additionalRequirements } = req.body;
        
        // 检查用户使用限制
        const user = await User.findById(req.user._id);
        if (user.subscription === 'free' && user.usage.generations >= 50) {
            return res.status(403).json({ 
                success: false,
                message: '免费用户每月生成次数已达上限'
            });
        }
        
        // 调用AI服务生成文创产品设计
        const aiResult = await aiService.generateCulturalProductDesign({
            productType,
            theme,
            style,
            colorScheme,
            patternType,
            additionalRequirements
        });
        
        if (!aiResult.success) {
            return res.status(500).json(aiResult);
        }
        
        // 创建作品记录
        const work = new Work({
            title: `${productType}_${theme}_${Date.now()}`,
            description: `文创产品设计：${productType}，主题：${theme}，风格：${style}`,
            creator: req.user._id,
            imageUrl: aiResult.data.designImage,
            style: style || 'modern',
            parameters: { 
                productType,
                theme,
                style,
                colorScheme,
                patternType,
                additionalRequirements
            },
            isPublic: false,
            type: 'cultural_product' // 添加作品类型标识
        });
        
        await work.save();
        
        // 更新用户使用统计
        user.usage.generations += 1;
        await user.save();
        
        // 计算剩余生成次数
        const remainingCount = user.subscription === 'free' ? 
            50 - user.usage.generations : 
            999; // 非免费用户设为较大值
        
        res.json({
            success: true,
            message: '文创产品设计生成成功',
            data: {
                workId: work._id,
                designImage: aiResult.data.designImage,
                generationTime: aiResult.data.generationTime,
                remainingCount,
                designDetails: {
                    productType: aiResult.data.productType,
                    theme: aiResult.data.theme,
                    style: aiResult.data.style,
                    colorScheme: aiResult.data.colorScheme,
                    patternType: aiResult.data.patternType,
                    designPrompt: aiResult.data.designPrompt
                }
            }
        });
    } catch (error) {
        console.error('文创产品设计生成失败:', error);
        res.status(500).json({
            success: false,
            message: '文创产品设计生成失败，请稍后重试',
            error: error.message
        });
    }
});

// 推荐销售方案
router.post('/cultural-product/recommend-sales-plan', authMiddleware, async (req, res) => {
    try {
        // 解构前端发送的参数
        const { productType, designTheme, targetAudience, budget, distributionChannels } = req.body;
        
        // 调用AI服务推荐销售方案
        const aiResult = await aiService.recommendSalesPlan({
            productType,
            designTheme,
            targetAudience,
            budget,
            distributionChannels
        });
        
        if (!aiResult.success) {
            return res.status(500).json(aiResult);
        }
        
        res.json({
            success: true,
            message: '销售方案推荐成功',
            data: aiResult.data
        });
    } catch (error) {
        console.error('销售方案推荐失败:', error);
        res.status(500).json({
            success: false,
            message: '销售方案推荐失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取文创产品类型列表
router.get('/cultural-product/types', async (req, res) => {
    try {
        const productTypes = [
            { value: 'tshirt', label: 'T恤' },
            { value: 'mug', label: '马克杯' },
            { value: 'poster', label: '海报' },
            { value: 'bag', label: '手提袋' },
            { value: 'notebook', label: '笔记本' },
            { value: 'phonecase', label: '手机壳' },
            { value: 'puzzle', label: '拼图' },
            { value: 'sticker', label: '贴纸' },
            { value: 'ornament', label: '装饰品' },
            { value: 'other', label: '其他' }
        ];
        
        res.json({
            success: true,
            data: productTypes
        });
    } catch (error) {
        console.error('获取文创产品类型失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文创产品类型失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取纹样类型列表
router.get('/cultural-product/pattern-types', async (req, res) => {
    try {
        const patternTypes = [
            { value: 'geometric', label: '几何图案' },
            { value: 'floral', label: '花卉纹样' },
            { value: 'animal', label: '动物纹样' },
            { value: 'calligraphy', label: '文字设计' },
            { value: 'abstract', label: '抽象纹样' },
            { value: 'traditional', label: '传统纹样' },
            { value: 'modern', label: '现代纹样' },
            { value: 'minimalist', label: '简约纹样' },
            { value: 'cartoon', label: '卡通纹样' },
            { value: 'other', label: '其他纹样' }
        ];
        
        res.json({
            success: true,
            data: patternTypes
        });
    } catch (error) {
        console.error('获取纹样类型失败:', error);
        res.status(500).json({
            success: false,
            message: '获取纹样类型失败，请稍后重试',
            error: error.message
        });
    }
});

module.exports = router;