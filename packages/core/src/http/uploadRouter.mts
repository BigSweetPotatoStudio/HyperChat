import { Router, Request, Response } from "express";
import { Logger } from "../log.mjs";
import { fs, path } from "zx";
import crypto from "crypto";
import multer from "multer";
import { appDataDir } from "../const.mjs";
const UPLOAD_DIR = "./uploads";

interface UploadedFileInfo {
    filename: string;
    filepath: string;
    mimetype: string;
}


// 文件上传配置
const uploadDirPath = path.join(appDataDir, UPLOAD_DIR);
fs.ensureDirSync(uploadDirPath);
fs.emptyDirSync(uploadDirPath); // 启动时清空上传目录

/**
 * 安全的文件上传配置
 * 限制文件类型和大小，防止安全漏洞
 */
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDirPath);
    },
    filename: (_req, file, cb) => {
        // 生成安全的文件名，避免路径遍历攻击
        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safeFilename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB 限制
        files: 10 // 最多10个文件
    },
    fileFilter: (_req, file, cb) => {
        // 基本的文件类型验证
        const allowedMimes = [
            'image/', 'text/', 'application/json', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats'
        ];
        const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime));
        cb(null, isAllowed);
    }
});

/**
 * 安全的文件处理
 * 生成文件哈希和安全文件名
 */
async function processUploadedFile(file: Express.Multer.File): Promise<UploadedFileInfo> {
    const fileContent = await fs.readFile(file.path);
    const hash = crypto.createHash("sha256").update(fileContent as any).digest("hex");
    const ext = path.extname(file.originalname);
    const newFilename = `${hash}${ext}`;
    const filepath = path.join(uploadDirPath, newFilename);

    await fs.move(file.path, filepath, { overwrite: true });

    return {
        filename: newFilename,
        filepath,
        mimetype: file.mimetype,
    };
}
export function createUploadRouter(): Router {
    const router = Router();

    // 文件上传接口
    // 优化的文件上传处理
    router.post('/uploads', upload.single('file'), async (req: Request, res: Response) => {
        const startTime = Date.now();

        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No file uploaded"
                });
                return;
            }

            const fileInfo = await processUploadedFile(req.file);
            const duration = Date.now() - startTime;

            Logger.info(`File uploaded successfully: ${fileInfo.filename} (${duration}ms)`);

            res.status(200).json({
                success: true,
                data: fileInfo,
            });
        } catch (error: any) {
            const duration = Date.now() - startTime;
            Logger.error(`File upload error (${duration}ms):`, error);

            res.status(500).json({
                success: false,
                message: process.env.myEnv === "dev"
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : 'File upload failed'
            });
        }
    });

    return router;
}
