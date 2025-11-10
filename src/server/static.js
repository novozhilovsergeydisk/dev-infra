import fs from 'fs';
import path from 'path';
import { sendJSON } from './utils.js';
import { MIME_TYPES } from './utils.js';

// Функция для отправки файла
export function sendFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                sendJSON(res, 404, {
                    success: false,
                    message: 'Файл не найден'
                });
            } else {
                sendJSON(res, 500, {
                    success: false,
                    message: 'Ошибка сервера'
                });
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': content.length,
            'Cache-Control': 'public, max-age=3600'
        });
        res.end(content);
    });
}
