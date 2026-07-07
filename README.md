# Mamoon Medical System

## Firebase setup

1. افتح Firebase Console وأنشئ مشروعًا جديدًا أو استخدم المشروع الحالي.
2. في Project Settings > General > Your apps، أضف Web App.
3. انسخ الإعدادات إلى ملف firebase-config.js.
4. فعّل Authentication > Sign-in method > Email/Password.
5. فعّل Firestore Database > Create database.
6. انقر على Rules وغيّرها إلى ما يلي:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /app-data/{docId} {
      allow read, write: if true;
    }
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

7. شغّل التطبيق عبر خادم محلي مثل:

```bash
python -m http.server 8000
```

8. افتح http://127.0.0.1:8000/index.html

## Notes
- التطبيق يعمل محليًا باستخدام localStorage إذا لم تكن Firebase جاهزة بعد.
- عند توفر Firebase، سيتم مزامنة البيانات تلقائيًا مع Firestore.
- لبناء APK أندرويد، ثبت Android Studio وقم بتشغيل:
  - npm install
  - npx cap add android
  - npx cap sync android
  - npx cap open android
