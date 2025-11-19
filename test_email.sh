#!/bin/bash

# Скрипт для тестирования эндпоинта /api/contact

# Отправляем POST-запрос с тестовыми данными
curl -X POST http://localhost:3001/api/contact \
-H "Content-Type: application/json" \
-d '{
    "name": "Тестовый пользователь",
    "email": "lombardozzi@appuse.ru",
    "phone": "+79991234567",
    "message": "Это тестовое сообщение для проверки работы почты."
}'

# Выводим пустую строку для лучшей читаемости
echo
