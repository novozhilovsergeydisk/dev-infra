import apiHandlers from './handlers.js';
import { sendJSON, checkRateLimit } from './utils.js';

export function handleRequest(req, res) {
    const clientIp = req.socket.remoteAddress;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // Логирование запросов
    console.log(`[${new Date().toLocaleTimeString('ru-RU')}] ${method} ${pathname} - ${clientIp}`);

    // CORS для OPTIONS запросов
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Проверка rate limit для API запросов
    if (pathname.startsWith('/api/') && pathname !== '/api/health') {
        if (!checkRateLimit(clientIp)) {
            sendJSON(res, 429, {
                success: false,
                message: 'Слишком много запросов. Пожалуйста, попробуйте позже'
            });
            return;
        }
    }

    // Обработка API запросов
    const apiKey = `${method} ${pathname}`;
    if (apiHandlers[apiKey]) {
        apiHandlers[apiKey](req, res);
        return true; // API request handled
    }

    return false; // API request not handled
}
