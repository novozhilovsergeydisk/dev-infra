import nodemailer from 'nodemailer';

// MIME types для статических файлов
export const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Rate limiting (простая реализация)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 минута
const RATE_LIMIT_MAX_REQUESTS = 60;
const CONTACT_LIMIT_MAX_REQUESTS = 5;

// Функция для проверки rate limit
export function checkRateLimit(ip, isContactForm = false) {
    const now = Date.now();
    const maxRequests = isContactForm ? CONTACT_LIMIT_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip);
    // Удаляем старые запросы
    const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (validRequests.length >= maxRequests) {
        return false;
    }

    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    return true;
}

// Функция для парсинга тела запроса
export function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Функция для отправки JSON ответа
export function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data, null, 2));
}

// Настройка транспорта для отправки email (nodemailer)
export function createEmailTransporter() {
    // Для продакшена используйте реальные настройки SMTP
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-password'
        },
        connectionTimeout: 10000, // 10 секунд
        greetingTimeout: 10000,   // 10 секунд
        socketTimeout: 10000      // 10 секунд
    });
}
