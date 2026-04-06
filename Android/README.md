# Folio — Android-приложение

Нативное Android-приложение для платформы Folio, реализованное на **Kotlin** с **Jetpack Compose**.

## Технологии

- **Kotlin** + **Jetpack Compose** (Material 3)
- **Hilt** (Dependency Injection)
- **Retrofit** + **OkHttp** (сетевые запросы)
- **Coil** (загрузка изображений)
- **Jetpack Navigation Compose**
- **DataStore** (хранение токенов)
- **minSdk 26**, **targetSdk 34**

## Структура проекта

```
app/src/main/java/com/folio/app/
├── FolioApp.kt            # Application class (@HiltAndroidApp)
├── MainActivity.kt        # Единственная Activity
├── data/
│   ├── api/
│   │   ├── ApiService.kt      # Retrofit интерфейс
│   │   └── AuthInterceptor.kt # Автоматическая вставка токена
│   └── models/
│       ├── Models.kt          # Модели данных
│       └── Responses.kt       # Обёртки ответов API
├── di/
│   └── AppModule.kt       # Hilt модуль (Retrofit, OkHttp, TokenManager)
├── util/
│   ├── TokenManager.kt    # Хранение токенов через DataStore
│   └── Extensions.kt      # Форматирование дат
└── ui/
    ├── theme/              # Material 3 тема
    ├── navigation/         # NavGraph со всеми маршрутами
    ├── auth/               # Экраны авторизации
    ├── home/               # Главная страница
    ├── project/            # Проекты, детали, загрузка
    ├── search/             # Поиск
    ├── profile/            # Профиль, настройки
    ├── collections/        # Коллекции
    ├── challenges/         # Челленджи
    ├── messages/           # Сообщения
    ├── notifications/      # Уведомления
    └── components/         # Переиспользуемые компоненты
```

## Функционал

- Регистрация / Вход / Восстановление пароля
- Лента проектов с сортировкой и пагинацией
- Детальный просмотр проектов с медиагалереей
- Лайки и комментарии
- Загрузка проектов через presigned URLs
- Поиск проектов
- Профили пользователей с подпиской
- Коллекции (создание, удаление, просмотр)
- Челленджи с работами участников
- Личные сообщения
- Уведомления с отметкой прочитанного
- Редактирование профиля с загрузкой аватара

## Сборка

1. Откройте папку `Android/` в **Android Studio** (Hedgehog или новее)
2. Дождитесь синхронизации Gradle
3. Запустите на эмуляторе или устройстве (API 26+)

API-адрес сервера настроен в `app/build.gradle.kts` → `buildConfigField`.
