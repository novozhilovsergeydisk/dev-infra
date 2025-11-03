import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// MIME types для статических файлов
const MIME_TYPES = {
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
function checkRateLimit(ip, isContactForm = false) {
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
function parseBody(req) {
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
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data, null, 2));
}

// Функция для отправки файла
function sendFile(res, filePath) {
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

// Настройка транспорта для отправки email (nodemailer)
function createEmailTransporter() {
    // Для продакшена используйте реальные настройки SMTP
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-password'
        }
    });
}

// API обработчики
const apiHandlers = {
    // Health check
    'GET /api/health': (req, res) => {
        sendJSON(res, 200, {
            success: true,
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    },

    // Калькулятор стоимости
    'POST /api/calculator/calculate': async (req, res) => {
        try {
            const body = await parseBody(req);
            const { projectType, pages, design, features } = body;

            // Валидация данных
            if (!projectType || !pages || !design) {
                sendJSON(res, 400, {
                    success: false,
                    message: 'Недостаточно данных для расчета'
                });
                return;
            }

            // Расчет стоимости
            let total = projectType.price + pages.price + design.price;

            if (features && Array.isArray(features)) {
                features.forEach(feature => {
                    total += feature.price || 0;
                });
            }

            sendJSON(res, 200, {
                success: true,
                data: {
                    total,
                    projectType,
                    pages,
                    design,
                    features: features || []
                }
            });
        } catch (error) {
            console.error('Ошибка при расчете:', error);
            sendJSON(res, 500, {
                success: false,
                message: 'Ошибка при расчете стоимости'
            });
        }
    },

    // Отправка контактной формы
    'POST /api/contact': async (req, res) => {
        const clientIp = req.socket.remoteAddress;

        // Проверка rate limit
        if (!checkRateLimit(clientIp, true)) {
            sendJSON(res, 429, {
                success: false,
                message: 'Слишком много заявок. Пожалуйста, попробуйте позже'
            });
            return;
        }

        try {
            const body = await parseBody(req);
            const { name, email, phone, message } = body;

            // Валидация
            if (!name || !email || !message) {
                sendJSON(res, 400, {
                    success: false,
                    message: 'Заполните все обязательные поля'
                });
                return;
            }

            // Валидация email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                sendJSON(res, 400, {
                    success: false,
                    message: 'Неверный формат email'
                });
                return;
            }

            // В продакшене здесь должна быть реальная отправка email
            // Для демонстрации просто логируем данные
            console.log('\n📧 Новая заявка:');
            console.log('───────────────────────────────');
            console.log('Имя:', name);
            console.log('Email:', email);
            console.log('Телефон:', phone || 'не указан');
            console.log('Сообщение:', message);
            console.log('Дата:', new Date().toLocaleString('ru-RU'));
            console.log('───────────────────────────────\n');

            // Отправка email (раскомментируйте для реальной отправки)
            /*
            const transporter = createEmailTransporter();
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: process.env.CONTACT_EMAIL || 'info@devinfra.ru',
                subject: `Новая заявка от ${name}`,
                html: `
                    <h2>Новая заявка с сайта</h2>
                    <p><strong>Имя:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Телефон:</strong> ${phone || 'не указан'}</p>
                    <p><strong>Сообщение:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p><small>Получено: ${new Date().toLocaleString('ru-RU')}</small></p>
                `
            });
            */

            sendJSON(res, 200, {
                success: true,
                message: 'Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.'
            });
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            sendJSON(res, 500, {
                success: false,
                message: 'Ошибка при отправке заявки. Попробуйте позже.'
            });
        }
    }
};

// Главный обработчик запросов
const server = http.createServer(async (req, res) => {
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
        await apiHandlers[apiKey](req, res);
        return;
    }

    // Обработка статических файлов
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
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 DevInfra Server запущен!                        ║
║                                                       ║
║   📡 Порт: ${PORT.toString().padEnd(44)             } ║
║   🌍 URL: http://${HOST}:${PORT}${' '.repeat(44 - HOST.length - PORT.toString().length) } ║
║   ⏰ Время: ${new Date().toLocaleString('ru-RU').padEnd(44)          } ║
║                                                       ║
║   📝 Доступные API endpoints:                         ║
║      GET  /api/health                                 ║
║      POST /api/contact                                ║
║      POST /api/calculator/calculate                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
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
