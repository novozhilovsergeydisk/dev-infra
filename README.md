# DevInfra - Сайт для агентства разработки

Профессиональный веб-сайт для IT-агентства, предлагающего услуги разработки сайтов и настройки серверной инфраструктуры.

## 🚀 Особенности

- **Нативный Node.js сервер** - без использования фреймворков (Express, Fastify и т.д.)
- **Современный дизайн** с поддержкой светлой/темной темы
- **Адаптивная вёрстка** для всех устройств
- **Интерактивный калькулятор** стоимости проекта
- **Форма обратной связи** с валидацией
- **Портфолио** с модальным просмотром
- **Rate Limiting** для защиты от спама
- **API endpoints** для обработки данных

## 📋 Требования

- Node.js версии 18.x или выше (для использования ES модулей и --watch флага)

## 🛠️ Установка

1. **Клонируйте репозиторий или скопируйте файлы:**
   ```bash
   cd dev-infra
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Создайте файл .env (опционально):**
   ```bash
   cp .env.example .env
   ```

   Отредактируйте `.env` файл и добавьте свои настройки для SMTP (если хотите включить отправку email).

## 🚀 Запуск

### Продакшен режим:
```bash
npm start
```

### Режим разработки (с автоматической перезагрузкой):
```bash
npm run dev
```

Сервер будет доступен по адресу: **http://localhost:3000**

## 📁 Структура проекта

```
dev-infra/
├── index.html          # Главная HTML страница
├── script.js           # JavaScript для фронтенда
├── server.js           # Нативный Node.js HTTP сервер
├── package.json        # Конфигурация проекта
├── .env.example        # Пример файла окружения
├── .gitignore         # Исключения для Git
└── README.md          # Документация
```

## 🔌 API Endpoints

### GET /api/health
Проверка состояния сервера
```bash
curl http://localhost:3000/api/health
```

**Ответ:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

### POST /api/contact
Отправка контактной формы

**Запрос:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+7 999 999-99-99",
    "message": "Хочу заказать сайт"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "message": "Спасибо! Ваша заявка отправлена..."
}
```

### POST /api/calculator/calculate
Расчет стоимости проекта

**Запрос:**
```bash
curl -X POST http://localhost:3000/api/calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": {"value": "landing", "price": 25000},
    "pages": {"value": "1-5", "price": 0},
    "design": {"value": "template", "price": 0},
    "features": [
      {"value": "cms", "price": 15000}
    ]
  }'
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "total": 40000,
    "projectType": {"value": "landing", "price": 25000},
    "pages": {"value": "1-5", "price": 0},
    "design": {"value": "template", "price": 0},
    "features": [{"value": "cms", "price": 15000}]
  }
}
```

## ⚙️ Настройка

### Переменные окружения (.env)

```env
# Настройки сервера
PORT=3000
HOST=localhost
NODE_ENV=production

# Настройки SMTP (для отправки email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email для получения заявок
CONTACT_EMAIL=info@devinfra.ru
```

### Настройка Email отправки

Для активации отправки email через SMTP:

1. Откройте `server.js`
2. Найдите блок кода в обработчике `/api/contact`:
   ```javascript
   // Отправка email (раскомментируйте для реальной отправки)
   /*
   const transporter = createEmailTransporter();
   await transporter.sendMail({...});
   */
   ```
3. Раскомментируйте этот блок
4. Настройте SMTP параметры в `.env` файле

**Для Gmail:**
- Включите двухфакторную аутентификацию
- Создайте App Password: https://support.google.com/accounts/answer/185833
- Используйте App Password в `SMTP_PASS`

## 🔒 Безопасность

Сервер включает:

- ✅ **Rate Limiting** - ограничение количества запросов
  - API: 60 запросов в минуту
  - Контактная форма: 5 заявок в час
- ✅ **Валидация входных данных**
- ✅ **Защита от Directory Traversal**
- ✅ **CORS настройки**
- ✅ **Безопасные заголовки**

## 🎨 Кастомизация

### Изменение цен
Отредактируйте значения `data-price` в `index.html`:
```html
<div class="quiz-option" data-value="landing" data-price="25000">
```

### Изменение контактной информации
В `index.html` найдите секцию `#contact` и обновите:
- Email
- Телефон
- Telegram

### Изменение портфолио
Замените URL изображений в секции `#portfolio`:
```html
<div class="portfolio-item" data-image="URL_ВАШЕГО_ИЗОБРАЖЕНИЯ">
```

## 📱 Адаптивность

Сайт полностью адаптирован для:
- 📱 Мобильных устройств (320px+)
- 📱 Планшетов (768px+)
- 💻 Десктопов (1024px+)
- 🖥️ Больших экранов (1920px+)

## 🌙 Темная тема

Переключение темы:
- Автоматическое сохранение выбранной темы в `localStorage`
- Кнопка переключения в верхнем меню
- Плавные переходы между темами

## 📊 Мониторинг

Логирование запросов в консоль:
```
[12:00:00] GET / - ::1
[12:00:01] POST /api/contact - ::1
```

## 🐛 Отладка

Для отладки включите NODE_ENV=development:
```bash
NODE_ENV=development npm start
```

В режиме разработки в ответах API будут включены stack trace ошибок.

## 📝 TODO

- [ ] Добавить unit тесты
- [ ] Интеграция с базой данных
- [ ] Админ-панель для управления заявками
- [ ] Логирование в файлы
- [ ] Prometheus метрики
- [ ] Docker контейнеризация
- [ ] CI/CD pipeline

## 📄 Лицензия

ISC

## 🤝 Поддержка

По всем вопросам пишите на: info@devinfra.ru

---

**Создано с ❤️ на нативном Node.js**
