import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleRequest } from './src/server/router.js';
import { sendFile } from './src/server/static.js';
import { sendJSON } from './src/server/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Главный обработчик запросов
const server = http.createServer(async (req, res) => {
    const apiRequestHandled = handleRequest(req, res);

    if (apiRequestHandled) {
        return;
    }

    // Обработка статических файлов
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    let filePath;
    if (pathname === '/') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        filePath = path.join(__dirname, 'public', pathname);
    }

    // Проверка безопасности пути (предотвращение directory traversal)
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(__dirname)) {
        sendJSON(res, 403, {
            success: false,
            message: 'Доступ запрещен'
        });
        return;
    }

    // Проверка существования файла
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Если файл не найден и это не API запрос, отдаем index.html (для SPA)
            if (!pathname.startsWith('/api/')) {
                sendFile(res, path.join(__dirname, 'index.html'));
            } else {
                sendJSON(res, 404, {
                    success: false,
                    message: 'API endpoint не найден'
                });
            }
        } else {
            sendFile(res, filePath);
        }
    });
});

// Запуск сервера
server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`API Endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  POST /api/contact`);
    console.log(`  POST /api/calculator/calculate`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nSIGTERM получен: закрываю HTTP сервер');
    server.close(() => {
        console.log('HTTP сервер закрыт');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT получен: закрываю HTTP сервер');
    server.close(() => {
        console.log('HTTP сервер закрыт');
        process.exit(0);
    });
});

// Обработка ошибок
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default server;