# Folio Mobile — React Native (Expo)

Кроссплатформенное мобильное приложение для Folio, работает на iOS и Android.

## Стек

- **React Native** 0.76 + **Expo SDK 52**
- React Navigation (Stack + Bottom Tabs)
- expo-secure-store (хранение токенов)
- expo-image-picker (выбор изображений)

## Запуск

```bash
cd mobile
npm install
npx expo start
```

Сканируйте QR-код с помощью **Expo Go** (iOS/Android).

## Сборка

```bash
# iOS (требуется EAS)
npx eas build --platform ios

# Android
npx eas build --platform android
```

## Экраны

| Экран | Описание |
|---|---|
| Login / Register / ForgotPassword | Авторизация, регистрация, восстановление |
| Home | Главная с категориями, трендовыми, последними проектами |
| Projects | Список проектов с сортировкой и пагинацией |
| ProjectDetail | Детали проекта, лайки, комментарии, медиа |
| Upload | Загрузка проекта через presigned URLs |
| Search | Поиск проектов |
| Profile | Профиль пользователя с подпиской |
| Settings | Редактирование профиля, аватар |
| Collections | Коллекции: создание, просмотр |
| CollectionDetail | Содержимое коллекции |
| Challenges | Список челленджей |
| ChallengeDetail | Детали челленджа, участие |
| Conversations | Список диалогов |
| Chat | Чат с пользователем |
| Notifications | Уведомления с типами |

## API

Приложение подключается к тому же бэкенду:
`https://folio-platform-folio.up.railway.app/api`
