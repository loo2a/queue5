# دليل الإعداد والتشغيل

## المتطلبات الأساسية

### 1. حساب Firebase
- إنشاء حساب على [Firebase Console](https://console.firebase.google.com)
- إنشاء مشروع جديد
- تفعيل Realtime Database
- نسخ إعدادات المشروع

### 2. حساب GitHub
- إنشاء حساب على GitHub
- إنشاء مستودع جديد
- تفعيل GitHub Pages

### 3. أدوات التطوير
- محرر نصوص (VS Code recommended)
- Git (لإدارة الإصدارات)

## خطوات الإعداد

### الخطوة 1: Firebase Setup

1. **إنشاء مشروع Firebase**
   - انتقل إلى [Firebase Console](https://console.firebase.google.com)
   - انقر على "Add project"
   - أدخل اسم المشروع (مثال: patient-calling-system)
   - فعّل Google Analytics إذا رغبت
   - انتظر حتى يتم إنشاء المشروع

2. **إعداد Realtime Database**
   - من القائمة الجانبية، اختر "Realtime Database"
   - انقر على "Create Database"
   - اختر الموقع المناسب (يفضل الأقرب لموقعك)
   - اختر "Start in test mode" للبدء
   - انقر على "Enable"

3. **نسخ إعدادات المشروع**
   - من إعدادات المشروع (Project Settings)
   - انتقل إلى قسم "Your apps"
   - انقر على رمز التكوين (`</>`)
   - انسخ إعدادات Firebase

### الخطوة 2: تكوين المشروع

1. **تحديث Firebase Configuration**
   ```javascript
   // في ملف js/firebase-config.js
   const firebaseConfig = {
       apiKey: "YOUR_ACTUAL_API_KEY",
       authDomain: "your-project-id.firebaseapp.com",
       databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
       projectId: "your-project-id",
       storageBucket: "your-project-id.appspot.com",
       messagingSenderId: "your-messaging-sender-id",
       appId: "your-app-id"
   };
   ```

2. **إعداد مسارات الملفات**
   - تحديث المسارات في إعدادات الإدارة
   - أو استخدام المسارات الافتراضية من GitHub

### الخطوة 3: GitHub Pages Setup

1. **إنشاء مستودع جديد**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **تفعيل GitHub Pages**
   - انتقل إلى إعدادات المستودع
   - انتقل إلى قسم "Pages"
   - اختر "Deploy from a branch"
   - اختر "main" branch و"/(root)" folder
   - انقر على "Save"

3. **انتظر التفعيل**
   - قد يستغرق التفعيل بضع دقائق
   - ستحصل على رابط الموقع: `https://yourusername.github.io/your-repo-name`

### الخطوة 4: إعداد ملفات الصوت

1. **إنشاء ملفات الصوت**
   - استخدم برنامج تسجيل صوتي
   - أو استخدم خدمات TTS عبر الإنترنت
   - احفظ الملفات بالصيغة المطلوبة

2. **رفع الملفات**
   - أنشئ مجلدات: `/audio`, `/media`, `/instant`
   - رفع ملفات الصوت المطلوبة
   - تأكد من الأسماء الصحيحة للملفات

### الخطوة 5: اختبار النظام

1. **الوصول للموقع**
   - افتح الرابط الخاص بـ GitHub Pages
   - تحقق من ظهور الصفحة الرئيسية

2. **اختبار الإدارة**
   - انتقل إلى صفحة الإدارة
   - أضف عيادة تجريبية
   - اختبر الإعدادات

3. **اختبار شاشة العرض**
   - انتقل إلى شاشة العرض
   - تحقق من ظهور العيادات
   - اختبار تشغيل الفيديوهات

4. **اختبار لوحة التحكم**
   - اختبر تسجيل الدخول للعيادة
   - اختبر زيادة ونقصان الأرقام
   - اختبر النداءات الصوتية

## حل المشكلات الشائعة

### مشكلة 1: لا يتم تحميل البيانات
- تحقق من إعدادات Firebase
- تأكد من تفعيل Realtime Database
- تحقق من قواعد الأمان (Security Rules)

### مشكلة 2: لا يعمل الصوت
- تحقق من مسارات الملفات الصوتية
- تأكد من وجود الملفات
- جرب تفعيل TTS كبديل

### مشكلة 3: GitHub Pages لا يعمل
- تأكد من تفعيل GitHub Pages
- تحقق من اسم المستودع
- انتظر بضع دقائق للتفعيل

### مشكلة 4: مشاكل في العرض
- تحقق من متصفحك (يفضل Chrome)
- امحي cache المتصفح
- جرب في نافذة التصفح الخفي

## الأمان المهم

### قواعد Firebase (Security Rules)
```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "settings": {
      ".write": false
    }
  }
}
```

### نصائح الأمان
- لا تشارك مفاتيح Firebase
- استخدم كلمات سر قوية للعيادات
- راقب استخدام قاعدة البيانات
- أنشئ نسخ احتياطية دورية

## التخصيص

### تغيير الشكل والمظهر
- عدل ملفات CSS في كل صفحة
- استخدم Tailwind CSS للتخصيص
- أضف شعاراتك الخاصة

### إضافة مميزات جديدة
- نظام إحصائيات متقدم
- إشعارات SMS للمرضى
- تكامل مع أنظمة أخرى
- تقارير مفصلة

## الدعم الفني

إذا واجهت مشاكل:
1. تحقق من console المتصفح للأخطاء
2. راجع ملف README.md
3. تأكد من خطوات الإعداد
4. تواصل مع فريق الدعم

## التحديثات المستقبلية

سيتم إضافة:
- نظام إحصائيات متقدم
- دعم اللغات المتعددة
- تكامل مع أنظمة الحجز
- تطبيقات الجوال

---

**ملاحظة:** هذا الدليل يفترض معرفة أساسية بـ HTML، CSS، JavaScript، وGit. إذا كنت بحاجة لمساعدة إضافية، راجع الوثائق الرسمية لكل تقنية.