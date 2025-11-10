import { sendJSON, parseBody, checkRateLimit, createEmailTransporter } from './utils.js';

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
            const emailRegex = /^[^S@]+@[^S@]+\.[^S@]+$/;
            if (!emailRegex.test(email)) {
                sendJSON(res, 400, {
                    success: false,
                    message: 'Неверный формат email'
                });
                return;
            }

            // В продакшене здесь должна быть реальная отправка email
            // Для демонстрации просто логируем данные
            console.log('\n\ud83d\udce8 Новая заявка:');
            console.log('───────────────────────────────');
            console.log('Имя:', name);
            console.log('Email:', email);
            console.log('Телефон:', phone || 'не указан');
            console.log('Сообщение:', message);
            console.log('Дата:', new Date().toLocaleString('ru-RU'));
            console.log('───────────────────────────────\n');

            // Отправка email (раскомментируйте для реальной отправки)
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

export default apiHandlers;
