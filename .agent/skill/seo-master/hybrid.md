---
name: hybrid-app-dev
description: แนวทางพัฒนา hybrid mobile app ด้วย Web stack + Capacitor (iOS/Android). ใช้เมื่อผู้ใช้ขอสร้าง/แก้ไข/debug แอปมือถือที่ใช้ WebView, ใช้ Capacitor plugin, ตั้งค่า native project, จัดการ permission, build หรือ deploy ขึ้น App Store / Google Play
---

# Hybrid App Development

## 1. หลักการทำงาน
- ถามก่อนเริ่มงานถ้าไม่ชัดเจน: framework (React/Vue/Angular), ใช้ Ionic UI หรือไม่, target platform (iOS/Android/PWA)
- เขียนโค้ดเป็น TypeScript เสมอ
- เขียนโค้ดที่เป็น web-first แล้วเรียก native ผ่าน plugin เท่านั้น
- ห้ามแก้ไฟล์ใน `ios/` และ `android/` ตรง ๆ ถ้ามีทางตั้งค่าผ่าน `capacitor.config.ts` หรือ plugin ได้

## 2. โครงสร้างโปรเจกต์
src/
  components/     # UI ที่ใช้ซ้ำ
  pages/          # หน้าจอ
  services/       # logic, API, wrapper ของ native plugin
  hooks/          # custom hooks
  store/          # state management
  theme/          # design tokens
capacitor.config.ts
ios/  android/    # native projects (generated)

## 3. Native Plugin
- ห่อ plugin ไว้ใน `services/` เพื่อ mock ตอนทดสอบบน browser ได้
- เช็คแพลตฟอร์มก่อนเรียก: `Capacitor.isNativePlatform()`
- ขอ permission ตอนที่ต้องใช้จริง พร้อมอธิบายเหตุผล และจัดการกรณีผู้ใช้ปฏิเสธ
- ใช้ plugin หลัก: Camera, Filesystem, Geolocation, Preferences, Push Notifications, Network, App

## 4. Performance
- Lazy load route และ component ขนาดใหญ่
- ใช้ virtual scroll สำหรับ list ยาว
- ลดขนาดรูปและใช้ WebP
- หลีกเลี่ยง animation ที่ใช้ layout property; ใช้ `transform`/`opacity`
- วัดผลบนเครื่องจริง ไม่ใช่แค่ emulator

## 5. UX แบบ Mobile
- รองรับ safe area (`env(safe-area-inset-*)`)
- ปุ่มกดอย่างน้อย 44x44 px
- จัดการ keyboard ไม่ให้บังช่องกรอก
- รองรับ hardware back button (Android) และ swipe-back (iOS)
- รองรับ offline: แสดงสถานะเครือข่ายและ cache ข้อมูลสำคัญ
- รองรับ dark mode

## 6. Security
- เก็บ token ใน secure storage (ไม่ใช่ localStorage)
- ใช้ HTTPS เท่านั้น
- ห้าม hardcode API key ในโค้ด client
- ตรวจ input และ deep link ก่อนใช้งาน
- ปิด debug/WebView inspection ใน production build

## 7. Build & Release
1. `npm run build`
2. `npx cap sync`
3. เปิดโปรเจกต์: `npx cap open ios` / `npx cap open android`
4. ตั้ง version/build number, icon, splash screen
5. Android: สร้าง signed AAB / iOS: Archive ผ่าน Xcode
6. ทดสอบผ่าน TestFlight / Internal Testing ก่อนส่ง review

## 8. Debug
- Web: Chrome DevTools
- Android: `chrome://inspect`
- iOS: Safari Web Inspector
- ถ้า plugin ไม่ทำงาน: เช็ค `npx cap sync`, permission ใน Info.plist / AndroidManifest.xml, แล้วค่อย clean build

## 9. Checklist ก่อนส่งงาน
- [ ] ทดสอบบนเครื่องจริงทั้ง iOS และ Android
- [ ] จัดการ error และ loading state ครบ
- [ ] ไม่มี console error / warning สำคัญ
- [ ] permission description ครบและชัดเจน
- [ ] Privacy policy และข้อมูลที่ store ต้องการพร้อม