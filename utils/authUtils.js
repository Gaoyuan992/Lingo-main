const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 生成JWT token
exports.generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// 验证JWT token
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// 认证中间件
exports.authMiddleware = async (req, res, next) => {
    let token;
    
    // 从请求头中获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // 从cookies中获取token
    else if (req.cookies.token) {
        token = req.cookies.token;
    }
    
    // 检查token是否存在
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未授权访问，请先登录'
        });
    }
    
    try {
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 获取用户信息但不包含密码
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'token无效或已过期'
        });
    }
};

// 生成cookie
exports.setTokenCookie = (res, token) => {
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };
    
    res.cookie('token', token, cookieOptions);
};