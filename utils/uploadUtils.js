const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 配置头像上传
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/avatars');
        ensureUploadDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${req.user._id}${ext}`);
    }
});

// 配置作品图片上传
const workStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/works');
        ensureUploadDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${req.user._id}${ext}`);
    }
});

// 文件类型验证
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('只支持图片文件（jpeg、jpg、png、gif、svg）！'));
    }
};

// 创建上传中间件
const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('avatar');

const uploadWorkImage = multer({
    storage: workStorage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
}).single('image');

// 处理上传错误的包装函数
exports.handleAvatarUpload = (req, res, next) => {
    uploadAvatar(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

exports.handleWorkImageUpload = (req, res, next) => {
    uploadWorkImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

// 获取文件的URL
exports.getFileUrl = (req, filePath) => {
    const relativePath = filePath.replace(path.join(__dirname, '../uploads'), '');
    return `${req.protocol}://${req.get('host')}/uploads${relativePath}`;
};