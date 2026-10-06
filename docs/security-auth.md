# บันทึกการออกแบบการยืนยันตัวตน

## แหล่งอ้างอิง

- [NextAuth.js OAuth provider configuration](https://next-auth.js.org/configuration/providers/oauth) — อธิบาย custom OAuth provider และ endpoint `token.request()` / `userinfo.request()` สำหรับผู้ให้บริการที่ไม่เป็นไปตามรูปแบบ OAuth มาตรฐาน
- [Auth.js: Configuring OAuth providers](https://authjs.dev/guides/configuring-oauth-providers) — รูปแบบ provider configuration และ mapping profile
- แนวทาง WebDev Authentication ที่อ่านจาก `/home/ubuntu/skills/webdev/references/authentication.md` — Manus OAuth endpoints, state/nonce, session cookie และการตรวจ project JWT

## ข้อกำหนดที่แอปนำมาใช้

Manus OAuth ไม่ใช่ OIDC มาตรฐานทั่วไป: เริ่ม authorization ที่ `MANUS_OAUTH_PORTAL_URL/app-auth` ด้วย `appId`, `redirectUri`, `state` (base64 JSON ที่มี redirect URI และ nonce) และ `responseType=code`; แลก authorization code ผ่าน `MANUS_OAUTH_API_URL/webdev.v1.WebDevAuthPublicService/ExchangeToken`; แล้วดึง identity ผ่าน `GetUserInfo`. แอปตรวจ nonce ที่ผูกกับ browser ก่อนแลก token และไม่สร้างตัวตนจำลองใน Preview.

Application session ใช้ cookie ชื่อ `webdev_app_session`; ตรวจ JWT แบบ HS256, expiry และ `appId` เทียบกับ `MANUS_PROJECT_ID`, จากนั้น resolve `openId` กับตาราง User/role. สำหรับ public HTTPS Preview ให้ cookie เป็น `SameSite=None; Secure` โดยกำหนดจาก `NEXTAUTH_URL` (public origin) ไม่ใช่ `NODE_ENV` หรือ scheme ภายในของ server. สิทธิ์ใหม่เริ่มเป็นครู; ผู้ดูแลระบบ bootstrap ได้เฉพาะ `INITIAL_ADMIN_OPEN_ID` ที่ผู้ดูแลกำหนดไว้ใน environment.
