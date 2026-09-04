# PCU Queue Display for Android TV (Ionic + Capacitor)

โปรเจกต์นี้ปรับจากหน้าจอ `pcu-screen.php` ที่แนบมา ให้เป็นแอป Android TV โดยใช้ Ionic/Angular + Capacitor และใช้ฐานข้อมูล/ตารางคิวเดิมของระบบ PHP

## สิ่งที่ทำให้แล้ว

- หน้าจอ Full HD/Android TV โทนและ layout ตาม `pcu-screen.php`
- แสดงคิวแยกตาม `depcode` แบบกำหนดได้ 1–8 จุดบริการ
- Highlight + กระพริบคิวที่กำลังเรียก
- Poll คิวทุก 3 วินาที (ปรับได้)
- แสดงจำนวนผู้รับบริการวันนี้และจำนวนรอรับบริการ
- Native HTTP ผ่าน Capacitor ลดปัญหา CORS กับ Server ภายใน LAN
- Android Native TextToSpeech ภาษาไทย ไม่ต้องเรียก Google Translate TTS จาก PHP
- Keep screen on + immersive fullscreen + landscape
- Android TV Leanback launcher
- ตั้งค่า Server URL, API path, depcode, ชื่อจุดบริการ จากหน้าจอ TV และจำค่าด้วย localStorage
- เปิดหน้าตั้งค่าด้วยปุ่ม `S` หรือ `F2`; ปิดด้วย `Esc/Back`

## โครงสร้างที่แนะนำ

```text
Android TV (Ionic APK)
        |
        | HTTP/LAN
        v
http://SERVER/display/api/queue-tv.php
        |
        v
HOSxP / Queue DB เดิม
```

## 1) ติดตั้ง API ที่ Server เดิม

1. สร้างโฟลเดอร์ `display/api/`
2. Copy `server-api/queue-tv.php` ไปเป็น `display/api/queue-tv.php`
3. ไฟล์นี้ใช้ `display/inc/config.php` เดิม และใช้ `mysql_*` เพื่อให้เข้ากับระบบที่แนบมา
4. ทดสอบ URL จากเครื่องใน LAN เช่น

```text
http://192.168.1.100/display/api/queue-tv.php
```

API รองรับ POST:
- `action=health`
- `action=calling&depcode=010,018,030`
- `action=stats&depcode=010,018,030`

> หมายเหตุ: `calling` จะเปลี่ยน `sd_queue_calling_status` จาก `Y` เป็น `N` หลังส่งคิวให้ TV เหมือนแนวคิดระบบเดิม ดังนั้นไม่ควรให้ TV หลายเครื่องใช้ depcode ชุดเดียวกันพร้อมกัน เว้นแต่ต้องการให้เครื่องใดเครื่องหนึ่งเป็นผู้ consume คิว

## 2) ติดตั้ง dependency

ต้องมี Node.js + npm และ Android Studio/Android SDK

```bash
npm install
```

## 3) ทดสอบบน Browser

```bash
npm start
```

เปิดหน้า settings แล้วกำหนด Server Base URL เช่น:

```text
http://192.168.1.100/display
```

API Path:

```text
api/queue-tv.php
```

## 4) สร้าง Android project ครั้งแรก

```bash
npm run build
npx cap add android
npm run cap:sync
```

คำสั่ง `cap:sync` จะเรียก `scripts/configure-android-tv.mjs` เพื่อปรับ Android project อัตโนมัติ ได้แก่:
- LEANBACK_LAUNCHER
- landscape
- allow HTTP ภายใน LAN
- TV banner
- immersive fullscreen
- keep screen on
- native Thai TTS plugin

## 5) เปิด Android Studio และ Build APK

```bash
npm run android:open
```

ใน Android Studio:

```text
Build > Build App Bundle(s) / APK(s) > Build APK(s)
```

สำหรับติดตั้งทดสอบผ่าน ADB:

```bash
adb install -r app-debug.apk
```

## 6) ค่าเริ่มต้น depcode ตาม `pcu-screen.php`

| depcode | จุดบริการ |
|---|---|
| 010 | จุดคัดกรอง |
| 018 | ห้องตรวจโรค 1 |
| 030 | ห้องจ่ายยาผู้ป่วยนอก |
| (ว่าง) | ห้องเจาะเลือด — ให้กำหนดรหัสจริงใน Settings |

## Android TV / เสียงภาษาไทย

แอปใช้ Android `TextToSpeech` โดยตรง ถ้า Android TV ไม่มี Thai voice ให้ติดตั้ง/เปิด TTS Engine ที่รองรับภาษาไทยใน Settings ของอุปกรณ์ก่อน

ค่า `อ่านชื่อผู้รับบริการในเสียงเรียก` ปิดไว้เป็นค่าเริ่มต้น เพื่อลดการประกาศข้อมูลส่วนบุคคลบนพื้นที่สาธารณะ

## กรณี Server เป็น HTTPS

เปลี่ยน Server Base URL เป็น `https://...` ได้ทันที ส่วน `cleartext` ถูกเปิดไว้เพื่อรองรับระบบโรงพยาบาลที่ยังใช้ `http://IP/...` ภายใน LAN

## ไฟล์ต้นฉบับที่นำมาอ้างอิง

- `pcu-screen.php`
- `ajax/getCallingQueue.php`
- `ajax/getWaitingQueue.php`
- `ajax/getCalledQueue.php`
- `ajax/getTotalQueue.php`
- `nongnae-team.jpg`
- `xhealthlogo1.png`
