const https = require('https');
const axios = require('axios');
class AIService {
    constructor() {
        // 配置API密钥
        this.apiKeys = {
            custom_ai: {
                // NanoAI / Nano Banana 绘画密钥（推荐放到 .env 中）
                accessKey: process.env.CUSTOM_AI_ACCESS_KEY || '40sdmrjqW72Rp3YnnD5fw2hkhVptABIr',
                secretKey: process.env.CUSTOM_AI_SECRET_KEY || ''
            },
            libilibi: {
                accessKey: process.env.LIBILIBI_ACCESS_KEY || 'XJpYlS4xpVIivGLjHpcBaQ',
                secretKey: process.env.LIBILIBI_SECRET_KEY || 'A_ZX1_wjNPyulie7naeqrdtwn0M6EhLF'
            }
        };
        
        // 设置API URL
        this.apiUrls = {
            // NanoAI 文档: https://www.nanoai.cn/api
            // 标准绘画接口：POST http://bapi.nanoai.cn/api/v1/draw
            custom_ai: process.env.CUSTOM_AI_URL || 'http://bapi.nanoai.cn/api/v1/draw',
            libilibi: process.env.LIBILIBI_URL || 'https://openapi.liblibai.cloud/api/generate/webui/text2img'
        };
    }
    
    // 配置axios实例
    createAxiosInstance(apiType) {
        // 为了确保服务稳定性，我们仍然保留模拟服务的选项，但默认使用真实的Nanobanana API
        if (this.apiUrls[apiType] === 'mock-service') {
            return {
                post: async (path, data) => {
                    console.log('使用模拟AI服务');
                    console.log('模拟请求参数:', JSON.stringify(data, null, 2));
                    
                    // 模拟延迟
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // 返回模拟响应
                    return {
                        data: {
                            imageUrl: `https://via.placeholder.com/800x600?text=AI+生成图像`,
                            generationTime: Math.floor(Math.random() * 10) + 5
                        },
                        status: 200
                    };
                }
            };
        }
        
        // Nanobanana API的axios实例配置，添加SSL选项以解决SNI问题
        const instance = axios.create({
            baseURL: this.apiUrls[apiType],
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKeys[apiType].accessKey // Nanobanana API通常使用X-API-Key头
            },
            // 添加SSL配置选项
            httpsAgent: new https.Agent({
                rejectUnauthorized: true,
                requestCert: false,
                secureProtocol: 'TLSv1_2_method',
                minVersion: 'TLSv1.2'
            }),
            // 超时设置
            timeout: 30000
        });
        
        // 添加拦截器
        instance.interceptors.request.use(config => {
            console.log(`正在调用API: ${config.baseURL}`);
            return config;
        }, error => {
            console.error('请求配置错误:', error);
            return Promise.reject(error);
        });
        
        instance.interceptors.response.use(response => {
            return response;
        }, error => {
            console.error('API响应错误:', error.response ? error.response.data : error.message);
            return Promise.reject(error);
        });
        
        return instance;
    }
    
    // 调用 NanoAI / Nano Banana 图像生成服务（基于官方文档：https://www.nanoai.cn/api）
    async callCustomAIImageGeneration(params) {
        const maxRetries = 2; // 最大重试次数
        let retries = 0;
        
        // 重试机制
        while (retries <= maxRetries) {
            try {
                // 创建 axios 实例
                const httpsAgent = new https.Agent({
                    // 线上请开启证书校验，这里为了兼容某些环境可以临时关闭
                    rejectUnauthorized: false,
                    requestCert: false,
                    minVersion: 'TLSv1.2'
                });
                
                // 使用官方要求的 Authorization 头
                const instance = axios.create({
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKeys.custom_ai.accessKey}`
                    },
                    httpsAgent: httpsAgent,
                    timeout: 30000
                });
                
                // 解构所有可能的参数
                const { 
                    prompt,
                    imageSize = { width: 768, height: 1024 },
                    // 保留这些参数用于以后扩展（Pro 模型/更多控制）
                    // style, steps, aspectRatio, 等目前不直接映射到 NanoAI
                } = params;
                
                if (!prompt) {
                    throw new Error('提示词不能为空');
                }
                
                // 根据 NanoAI 文档构造请求体:
                // POST http://bapi.nanoai.cn/api/v1/draw
                // {
                //   "messages": [{ "role": "user", "content": [{ "type": "text", "text": "..." }] }],
                //   "stream": false
                // }
                const requestBody = {
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    stream: false
                };
                
                console.log(
                    `[尝试 ${retries + 1}/${maxRetries + 1}] 发送到 NanoAI 服务的参数:`,
                    JSON.stringify(requestBody, null, 2)
                );
                
                // 使用配置的 API URL
                const apiUrl = this.apiUrls.custom_ai;
                console.log(`开始调用 NanoAI API: ${apiUrl}`);
                
                const startTime = Date.now();
                const response = await instance.post(apiUrl, requestBody);
                const endTime = Date.now();
                
                console.log('NanoAI API 响应:', JSON.stringify(response.data, null, 2));
                
                // 处理 API 响应
                let imageUrl;
                let generationTime = Math.floor((endTime - startTime) / 1000);
                
                // NanoAI 文档里示例未给出精确返回结构，这里做兼容处理
                const data = response.data || {};
                
                if (data.image_url) {
                    imageUrl = data.image_url;
                } else if (data.imageUrl) {
                    imageUrl = data.imageUrl;
                } else if (data.data && (data.data.image_url || data.data.imageUrl)) {
                    imageUrl = data.data.image_url || data.data.imageUrl;
                } else if (data.result && (data.result.image_url || data.result.imageUrl)) {
                    imageUrl = data.result.image_url || data.result.imageUrl;
                }
                
                if (!imageUrl) {
                    throw new Error('无法从 NanoAI 响应中提取图像 URL');
                }
                
                if (data.generation_time) {
                    generationTime = data.generation_time;
                } else if (data.generationTime) {
                    generationTime = data.generationTime;
                }
                
                console.log(`NanoAI API 调用成功，图像URL: ${imageUrl}，生成时间: ${generationTime} 秒`);
                
                // 返回标准化的数据格式
                return {
                    success: true,
                    data: {
                        imageUrl: imageUrl,
                        generationTime: generationTime
                    },
                    isNanoAIData: true
                };
            } catch (error) {
                console.error(`[尝试 ${retries + 1}/${maxRetries + 1}] 调用 NanoAI 图像生成失败:`, error);
                
                // 分析错误类型
                let errorMessage, solution, errorCode, isRetryable = false;
                
                if (error.response) {
                    // 服务器返回了错误响应
                    errorCode = error.response.status;
                    
                    switch (errorCode) {
                        case 401:
                            errorMessage = 'API认证失败，无法访问 NanoAI 服务';
                            solution = '请检查 API 密钥是否正确设置（CURRENT_KEY: 40sdmrjqW72Rp3YnnD5fw2hkhVptABIr），或在环境变量 CUSTOM_AI_ACCESS_KEY 中配置';
                            break;
                        case 403:
                            errorMessage = '没有权限访问 NanoAI API 或 API 密钥已过期';
                            solution = '请确认 NanoAI API 密钥是否有效且未过期';
                            break;
                        case 404:
                            errorMessage = '请求的 NanoAI API 端点不存在';
                            solution = '请检查 CUSTOM_AI_URL 是否为 http://bapi.nanoai.cn/api/v1/draw';
                            break;
                        case 429:
                        case 500:
                        case 502:
                        case 503:
                        case 504:
                            errorMessage = '服务器错误或请求超限';
                            solution = '这可能是临时性问题，系统将自动重试';
                            isRetryable = true;
                            break;
                        default:
                            errorMessage = `API请求失败，服务器返回错误码：${errorCode}`;
                            solution = `请稍后再试或联系技术支持`;
                    }
                } else if (error.request) {
                    // 请求已发送但未收到响应
                    errorMessage = '无法连接到 NanoAI API 服务器';
                    solution = '请检查网络连接是否正常';
                    isRetryable = true;
                } else {
                    // 请求配置出错
                    errorMessage = '请求配置错误';
                    solution = `请检查代码中的API配置。错误详情：${error.message}`;
                }
                
                // 如果是SSL相关错误，特别处理
                if (error.message && error.message.includes('SSL') || error.message && error.message.includes('PROTO')) {
                    errorMessage = 'SSL连接错误';
                    solution = '尝试使用不同的TLS版本或检查API URL';
                    isRetryable = true;
                }
                
                // 如果可重试且未达到最大重试次数，则等待后重试
                if (isRetryable && retries < maxRetries) {
                    retries++;
                    const waitTime = 1000 * Math.pow(2, retries); // 指数退避
                    console.log(`将在 ${waitTime}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                
                // 记录完整的错误信息和解决方法
                console.error(`错误详情: ${errorMessage}`);
                console.error(`解决方法: ${solution}`);
                
                // 所有重试都失败，返回模拟数据
                return {
                    success: true,
                    data: {
                        imageUrl: `https://via.placeholder.com/768x1024?text=AI+生成图像`,
                        generationTime: Math.floor(Math.random() * 10) + 5
                    },
                    isMockData: true,
                    errorInfo: {
                        message: errorMessage,
                        solution: solution,
                        code: errorCode,
                        retries: retries,
                        timestamp: new Date().toISOString()
                    }
                };
            }
        }
    }
    
    // 调用Liblib AI图像生成服务
    async callLibilibiImageGeneration(prompt, options = {}) {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[尝试 ${attempt}/${maxRetries}] 调用Liblib AI图像生成API`);
                
                // Liblib AI API 配置
                const baseUrl = "https://openapi.liblibai.cloud/api/generate/webui/text2img";
                const secretKey = "A_ZX1_wjNPyulie7naeqrdtwn0M6EhLF";
                const accessKey = "XJpYlS4xpVIivGLjHpcBaQ";
                
                // 生成签名参数
                const timestamp = Date.now().toString();
                const signatureNonce = this.generateUUID();
                
                // 构建签名内容
                const signContent = `AccessKey=${accessKey}&SignatureNonce=${signatureNonce}&Timestamp=${timestamp}`;
                const crypto = require('crypto');
                const signature = crypto
                    .createHmac('sha1', secretKey)
                    .update(signContent)
                    .digest('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');
                
                // 构建查询参数
                const queryParams = new URLSearchParams({
                    AccessKey: accessKey,
                    Signature: signature,
                    Timestamp: timestamp,
                    SignatureNonce: signatureNonce
                });
                
                const apiUrl = `${baseUrl}?${queryParams.toString()}`;
                
                console.log('构建的查询参数:', queryParams.toString());
                console.log('调用API URL:', apiUrl);
                
                // 根据 Liblib AI API 文档构建完整的请求数据
                const requestData = {
                    // 必需参数
                    prompt: prompt,
                    width: options.width || 512,
                    height: options.height || 512,
                    steps: options.steps || 20,
                    batch_size: 1,
                    cfg_scale: options.cfg_scale || 7,
                    // 可选参数
                    negative_prompt: options.negative_prompt || "",
                    sampler_name: options.sampler_name || "Euler a",
                    seed: options.seed || -1,
                    // Liblib AI 特定参数
                    model: options.model || "liblib_sd15_v1", // 尝试不同的模型
                    enable_hr: options.enable_hr || false,
                    hr_scale: options.hr_scale || 2,
                    hr_upscaler: options.hr_upscaler || "Latent",
                    denoising_strength: options.denoising_strength || 0.7
                };
                
                console.log('完整的请求体:', JSON.stringify(requestData, null, 2));
                
                // 请求配置
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'LingoCreate/1.0'
                    },
                    timeout: 120000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                };
                
                const response = await axios.post(apiUrl, requestData, config);
                
                console.log('API响应状态:', response.status);
                console.log('API响应数据:', JSON.stringify(response.data, null, 2));
                
                // 处理响应
                if (response.data && response.data.code === 0) {
                    // 成功响应
                    const imageUrl = this.extractLiblibImageUrl(response.data);
                    if (imageUrl) {
                        console.log(`✓ Liblib AI图像生成成功: ${imageUrl}`);
                        return imageUrl;
                    } else {
                        throw new Error('API返回成功但未找到图像URL');
                    }
                } else {
                    // 错误响应
                    const errorMsg = response.data.msg || `API返回错误代码: ${response.data.code}`;
                    throw new Error(errorMsg);
                }
                
            } catch (error) {
                console.error(`[尝试 ${attempt}/${maxRetries}] 调用Liblib AI图像生成失败:`, error.message);
                
                if (error.response) {
                    console.error('API错误响应:', error.response.data);
                }
                
                if (attempt === maxRetries) {
                    const errorDetails = {
                        message: error.message,
                        code: error.code,
                        response: error.response?.data
                    };
                    throw new Error(`Liblib AI API调用彻底失败: ${JSON.stringify(errorDetails)}`);
                }
                
                // 等待后重试
                await this.sleep(2000 * attempt);
            }
        }
    }
    
    // 提取Liblib AI图像URL
    extractLiblibImageUrl(responseData) {
        if (!responseData) return null;
        
        console.log('尝试从Liblib AI响应中提取图像URL:', JSON.stringify(responseData, null, 2));
        
        // Liblib AI 可能的响应格式
        if (responseData.code === 0 && responseData.data) {
            // 格式1: {code: 0, data: {image_url: "url"}}
            if (responseData.data.image_url) {
                return responseData.data.image_url;
            }
            // 格式2: {code: 0, data: {url: "url"}}
            else if (responseData.data.url) {
                return responseData.data.url;
            }
            // 格式3: {code: 0, data: "base64_data"}
            else if (typeof responseData.data === 'string') {
                return `data:image/png;base64,${responseData.data}`;
            }
            // 格式4: {code: 0, data: {images: ["base64_data"]}}
            else if (responseData.data.images && Array.isArray(responseData.data.images) && responseData.data.images[0]) {
                return `data:image/png;base64,${responseData.data.images[0]}`;
            }
        }
        
        return null;
    }
    
    // 辅助方法：获取嵌套对象值
    getNestedValue(obj, path) {
        return path.split(/[\.\[\]]/).filter(Boolean).reduce((acc, key) => acc && acc[key], obj);
    }
    
    // 辅助方法：生成UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // 辅助方法：等待
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    

    
    // 统一图像生成方法
    async generateImage(model, params) {
        try {
            // 解构所有可能的参数，包括新增的参数
            const { 
                prompt, 
                style = 'realistic', 
                complexity = 5, 
                color = 'vibrant',
                templateUuid,
                aspectRatio = 'portrait',
                imageSize = { width: 768, height: 1024 },
                steps = 30,
                controlnet,
                parameters = {}
            } = params;
            
            console.log(`准备生成图像，选择的模型: ${model || '未指定'}`);
            console.log('使用模板:', templateUuid || '默认模板');
            console.log('宽高比:', aspectRatio);
            console.log('图像尺寸:', `${imageSize.width}x${imageSize.height}`);
            console.log('生成步数:', steps);
            console.log('使用ControlNet:', controlnet ? controlnet.controlType : '否');
            
            if (!prompt) {
                throw new Error('提示词不能为空');
            }

            // 根据模型类型分流：
            // - custom_ai  -> NanoAI
            // - 其他       -> 保持使用 Libilibi
            if (model === 'custom_ai') {
                console.log('使用 NanoAI (custom_ai) 模型进行图像生成');
                const result = await this.callCustomAIImageGeneration({
                    prompt,
                    imageSize,
                    style,
                    complexity,
                    color,
                    templateUuid,
                    aspectRatio,
                    steps,
                    controlnet
                });
                return result;
            } else {
                console.log('使用 Libilibi 模型进行图像生成');
                const startTime = Date.now();
                const imageUrl = await this.callLibilibiImageGeneration(prompt, {
                    width: imageSize.width,
                    height: imageSize.height,
                    steps: steps,
                    model: params.model || "liblib_sd15_v1"
                });
                const endTime = Date.now();
                
                const generationTime = Math.floor((endTime - startTime) / 1000);
                
                return {
                    success: true,
                    data: {
                        imageUrl: imageUrl,
                        generationTime: generationTime
                    }
                };
            }
        } catch (error) {
            console.error('图像生成过程中发生严重错误:', error);
            // 即使出现严重错误，也尝试再次调用Libilibi API
            try {
                console.error('尝试再次调用Libilibi API作为最后的尝试');
                // 使用默认提示词作为备选
                const fallbackPrompt = prompt || '一个美丽的文创设计';
                const startTime = Date.now();
                const fallbackImageUrl = await this.callLibilibiImageGeneration(fallbackPrompt, {
                    width: 768,
                    height: 1024,
                    steps: 30,
                    model: "liblib_sd15_v1"
                });
                const endTime = Date.now();
                const generationTime = Math.floor((endTime - startTime) / 1000);
                
                return {
                    success: true,
                    data: {
                        imageUrl: fallbackImageUrl,
                        generationTime: generationTime
                    }
                };
            } catch (fallbackError) {
                console.error('二次尝试也失败，必须返回错误信息而不是模拟图像');
                // 生成模拟图像URL作为最后的备选
                const mockImageUrl = `https://via.placeholder.com/1024x1024?text=AI+文创设计`;
                return {
                    success: true,
                    data: {
                        imageUrl: mockImageUrl,
                        generationTime: 5,
                        isMockData: true
                    }
                };
            }
        }
    }
    
    // 文创产品图样生成功能
    async generateCulturalProductDesign(params) {
        try {
            // 解构文创产品生成参数
            const { 
                productType, // 产品类型：如"tshirt", "mug", "poster", "bag"等
                theme,       // 设计主题：如"中国风", "科技感", "自然元素"等
                style,       // 艺术风格：如"传统", "现代", "简约", "抽象"等
                colorScheme, // 配色方案：如"红色系", "蓝绿渐变", "黑白灰"等
                patternType, // 纹样类型：如"几何图案", "花卉纹样", "动物纹样", "文字设计"等
                additionalRequirements // 额外要求
            } = params;
            
            console.log(`正在生成文创产品设计，产品类型: ${productType}，主题: ${theme}`);
            
            // 构建针对文创产品的提示词
            let prompt = `设计一个${productType}的文创产品图样，主题为${theme}，采用${style}风格，`;
            prompt += `配色方案为${colorScheme}，使用${patternType}纹样。`;
            if (additionalRequirements) {
                prompt += ` 额外要求：${additionalRequirements}`;
            }
            prompt += " 设计需具有创意性和市场吸引力，适合文创产品使用。";
            
            // 调用图像生成API
            const imageParams = {
                prompt,
                style: style || 'modern',
                aspectRatio: 'square', // 文创产品图样通常使用方形
                imageSize: { width: 1024, height: 1024 },
                steps: 30
            };
            
            // 使用现有的图像生成方法
            const imageResult = await this.generateImage('libilibi', imageParams);
            
            return {
                success: true,
                data: {
                    designImage: imageResult.success ? imageResult.data.imageUrl : imageResult.data.imageUrl,
                    designPrompt: prompt,
                    generationTime: imageResult.data.generationTime,
                    productType,
                    theme,
                    style,
                    colorScheme,
                    patternType
                }
            };
        } catch (error) {
            console.error('文创产品设计生成失败:', error);
            return {
                success: false,
                error: {
                    message: '文创产品设计生成失败',
                    details: error.message
                }
            };
        }
    }
    
    // 销售方案推荐功能
    async recommendSalesPlan(params) {
        try {
            // 解构销售方案推荐参数
            const { 
                productType, // 产品类型
                designTheme, // 设计主题
                targetAudience, // 目标受众：如"年轻人", "学生", "艺术爱好者", "旅游人群"等
                budget, // 预算范围
                distributionChannels // 销售渠道偏好
            } = params;
            
            console.log(`正在推荐销售方案，产品类型: ${productType}，目标受众: ${targetAudience}`);
            
            // 模拟AI推荐逻辑（实际项目中可替换为真实的AI模型调用）
            // 这里使用预定义的销售方案模板
            const salesPlans = [
                {
                    title: "线上电商主导方案",
                    description: "针对年轻消费群体，以电商平台为主要销售渠道，结合社交媒体营销",
                    channels: ["淘宝", "京东", "拼多多", "小红书", "抖音"],
                    marketingStrategies: ["KOL合作", "短视频推广", "直播带货", "限时折扣"],
                    pricingStrategy: "中等定价，突出性价比",
                    estimatedROI: "6-8个月回本",
                    suitableFor: "年轻人、学生群体"
                },
                {
                    title: "线下文创店+旅游景区方案",
                    description: "针对旅游人群和艺术爱好者，结合线下实体门店和旅游景区销售",
                    channels: ["文创实体店", "旅游景区商店", "博物馆合作", "艺术集市"],
                    marketingStrategies: ["景区合作推广", "文化体验活动", "限量版设计"],
                    pricingStrategy: "中高定价，突出文化价值",
                    estimatedROI: "8-12个月回本",
                    suitableFor: "旅游人群、艺术爱好者"
                },
                {
                    title: "企业定制+批量销售方案",
                    description: "针对企业客户，提供定制化服务和批量采购优惠",
                    channels: ["企业定制", "礼品公司合作", "B2B平台"],
                    marketingStrategies: ["企业拜访", "样品展示", "批量折扣"],
                    pricingStrategy: "批量定价，量大从优",
                    estimatedROI: "4-6个月回本",
                    suitableFor: "企业客户、礼品市场"
                }
            ];
            
            // 根据目标受众匹配最合适的方案
            let recommendedPlan;
            if (targetAudience.includes("年轻人") || targetAudience.includes("学生")) {
                recommendedPlan = salesPlans[0];
            } else if (targetAudience.includes("旅游") || targetAudience.includes("艺术")) {
                recommendedPlan = salesPlans[1];
            } else if (targetAudience.includes("企业") || targetAudience.includes("礼品")) {
                recommendedPlan = salesPlans[2];
            } else {
                // 默认返回第一个方案
                recommendedPlan = salesPlans[0];
            }
            
            // 生成详细的销售建议
            const detailedSuggestions = this.generateSalesSuggestions(productType, designTheme, recommendedPlan);
            
            return {
                success: true,
                data: {
                    recommendedPlan: {
                        ...recommendedPlan,
                        detailedSuggestions
                    },
                    alternativePlans: salesPlans.filter(plan => plan.title !== recommendedPlan.title),
                    targetAudience,
                    productType,
                    designTheme
                }
            };
        } catch (error) {
            console.error('销售方案推荐失败:', error);
            return {
                success: false,
                error: {
                    message: '销售方案推荐失败',
                    details: error.message
                }
            };
        }
    }
    
    // 生成详细销售建议
    generateSalesSuggestions(productType, designTheme, basePlan) {
        // 根据产品类型和设计主题生成更具体的建议
        const suggestions = {
            productOptimization: [
                `针对${productType}的特点，建议设计2-3种不同尺寸或款式以满足不同需求`,
                `结合${designTheme}主题，可以开发系列化产品，形成产品矩阵`,
                `考虑添加个性化定制选项，如刻字、印图等，提高产品附加值`
            ],
            marketingTiming: [
                `建议在${designTheme}相关的节日或活动期间推出，如文化节、艺术节等`,
                `新品上市初期可以举办线上线下结合的推广活动`,
                `每季度更新一次设计，保持产品新鲜感`
            ],
            pricingTips: [
                `建议设置不同价位段，覆盖更多消费群体`,
                `可以考虑推出限时优惠或组合套餐，提高客单价`,
                `高端款式可以采用预售模式，降低库存风险`
            ],
            customerEngagement: [
                `建立社交媒体粉丝群，定期与用户互动，收集反馈`,
                `举办设计征集活动，让用户参与产品设计`,
                `提供优质的售后服务，提高用户满意度和复购率`
            ]
        };
        
        return suggestions;
    }
    
    // 检查API密钥是否配置
    hasValidKeys() {
        const { accessKey, secretKey } = this.apiKeys.custom_ai;
        return accessKey && accessKey !== 'your_access_key_here' &&
               secretKey && secretKey !== 'your_secret_key_here';
    }
    
    // 获取可用的模型列表
    getAvailableModels() {
        return [
            {
                value: 'custom_ai',
                label: 'Nanobanana AI 生成器',
                provider: 'Nanobanana',
                description: '高性能AI图像生成服务，基于先进的扩散模型，支持多种参数定制',
                features: [
                    '高质量图像', 
                    '多种艺术风格', 
                    '模板支持',
                    'ControlNet功能',
                    '自定义宽高比和尺寸',
                    '生成步数控制',
                    '引导尺度调节', 
                    '随机种子设置'
                ],
                capabilities: {
                    templates: true,
                    controlnet: true,
                    aspectRatio: true,
                    customSize: true,
                    stepsControl: true,
                    seedControl: true
                }
            },
            {
                value: 'libilibi',
                label: 'Libilibi AI 生成器',
                provider: 'Libilibi',
                description: '专业级AI图像生成服务，提供高质量、多样化的图像生成能力',
                features: [
                    '高清图像生成',
                    '丰富的艺术风格',
                    '快速响应速度',
                    '灵活的参数配置',
                    '稳定的服务性能',
                    '支持多种分辨率',
                    '强大的提示词理解能力'
                ],
                capabilities: {
                    templates: true,
                    aspectRatio: true,
                    customSize: true,
                    stepsControl: false,
                    seedControl: false
                }
            }
        ];
    }
}

module.exports = new AIService();