# Folio iOS App

Нативное iOS-приложение для платформы Folio, построенное на SwiftUI.

## Требования

- Xcode 15+
- iOS 16+
- Swift 5.9+

## Настройка проекта

1. Откройте Xcode
2. File → New → Project → App
3. Product Name: **FolioApp**
4. Team: выберите ваш Apple Developer аккаунт
5. Organization Identifier: `com.folio`
6. Interface: **SwiftUI**
7. Language: **Swift**
8. После создания проекта удалите сгенерированные файлы (`ContentView.swift`, `FolioAppApp.swift`)
9. Перетащите все файлы из этой папки `FolioApp/` в Xcode проект
10. Убедитесь, что target membership установлен правильно для всех файлов

## Структура

```
FolioApp/
├── FolioApp.swift          # Точка входа
├── ContentView.swift       # Корневой view (роутинг)
├── Config.swift            # Конфигурация API
├── Models/                 # Модели данных (Codable)
├── Services/               # API клиент, Keychain
├── ViewModels/             # Бизнес-логика
└── Views/
    ├── Auth/               # Вход, регистрация, сброс пароля
    ├── Main/               # TabView (главный экран)
    ├── Home/               # Лента, карточки проектов
    ├── Projects/           # Список, деталь, загрузка проекта
    ├── Search/             # Поиск проектов и пользователей
    ├── Profile/            # Профиль, настройки
    ├── Collections/        # Коллекции
    ├── Challenges/         # Челленджи
    ├── Messages/           # Сообщения
    └── Notifications/      # Уведомления
```

## Функционал

- Регистрация и вход с верификацией email
- Просмотр ленты проектов (по популярности/дате)
- Детальный просмотр проекта с медиа-галереей
- Загрузка проектов через presigned S3 URLs
- Комментарии к проектам
- Лайки проектов
- Подписки на пользователей
- Личные сообщения
- Коллекции
- Челленджи
- Уведомления
- Поиск
- Редактирование профиля

## API

Приложение подключается к бэкенду: `https://folio-platform-folio.up.railway.app/api`

Авторизация через Bearer token в заголовке `Authorization`.
