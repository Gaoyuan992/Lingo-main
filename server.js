const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '.')));

// 数据库连接选项 - 更新到MongoDB Driver 4.0+版本推荐配置
const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // 使用IPv4，避免可能的IPv6问题
    // 注意：从MongoDB Driver 4.0.0开始，useNewUrlParser和useUnifiedTopology已被移除
};

// 数据库连接
mongoose.connect(process.env.MONGO_URI, mongooseOptions)
    .then(() => console.log('MongoDB 连接成功'))
    .catch(err => {
        console.error('MongoDB 连接失败:', err);
        console.log('尝试重新连接...');
        // 实现简单的重连机制
        setTimeout(() => {
            mongoose.connect(process.env.MONGO_URI, mongooseOptions)
                .then(() => console.log('MongoDB 重新连接成功'))
                .catch(err => console.error('MongoDB 重新连接失败:', err));
        }, 3000);
    });

// 导入路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const generatorRoutes = require('./routes/generatorRoutes');
const worksRoutes = require('./routes/worksRoutes');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/works', worksRoutes);

// 前端页面路由 - 单页应用支持
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});