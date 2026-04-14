# Hades Mobile App

Энэ бол `hades-server` backend-тэй холбогддог Expo mobile app.

## QR-аар утсан дээр нээх

1. Backend асаана

```bash
cd ..
npm start
```

2. Expo app асаана

```bash
npm.cmd run start:lan
```

Хэрвээ LAN ажиллахгүй бол:

```bash
npm.cmd run start:tunnel
```

3. Утсандаа `Expo Go` суулгана

- Android: Expo Go from Play Store
- iPhone: Expo Go from App Store

4. Terminal дээр гарсан QR кодыг Expo Go-оор уншуулна

## Root folder-оос шууд ажиллуулах

Backend:

```bash
npm start
```

Expo QR:

```bash
npm run mobile
```

Expo QR tunnel:

```bash
npm run mobile:tunnel
```

## API холболт

App нь default байдлаар Expo development host-ийн IP-г ашиглаад backend рүү `http://<your-lan-ip>:3000` гэж холбогдоно.

Хэрвээ гараар заах хэрэгтэй бол `hades-app` дотор `.env` файл үүсгээд:

```bash
EXPO_PUBLIC_API_URL=http://172.36.1.112:3000
```

гэж өгч болно.

## Чухал анхаарах зүйлс

- Утас болон компьютер нэг сүлжээнд байвал `start:lan` хамгийн хурдан.
- Windows firewall `Node.js`-ийг private network дээр зөвшөөрсөн байх хэрэгтэй.
- Backend асаахад console дээр `LAN URL` гарч ирнэ. Тэр IP-г browser-оор утаснаас нээж шалгаж болно.
- `start:tunnel` нь QR нээхэд тусалдаг ч API тань локал backend байгаа бол ихэнхдээ LAN тохиргоо илүү зөв ажиллана.
