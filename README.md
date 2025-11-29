# Spotify Playlist Visual Generator

เว็บแอปพลิเคชันสำหรับสร้างภาพ Playlist จากเพลงที่เลือกจาก Spotify ออกแบบมาเพื่อ BUSSINGJAPAN

## ฟีเจอร์

- **ค้นหาเพลงจาก Spotify** - ค้นหาเพลงอัตโนมัติเมื่อหยุดพิมพ์ 1.5 วินาที
- **เลือกเพลง 12 เพลง** - เลือกเพลงที่ชอบเพื่อสร้าง Playlist ของตัวเอง
- **ลากเพื่อเรียงลำดับ** - ปรับลำดับเพลงได้ด้วยการลาก (Drag & Drop)
- **สร้างภาพ Playlist** - Export เป็นภาพ PNG พร้อมเทมเพลตสวยงาม
- **ตรวจสอบ Spotify Premium** - หน้าโปรไฟล์สำหรับตรวจสอบสถานะ Premium

![Profile page](https://www.imgcomp.thebeus.com/compressed/Screenshot_2025_1129_120338.webp)

## หน้าเว็บ

| หน้า | คำอธิบาย |
|------|----------|
| `/` | หน้าหลัก - ค้นหาและเลือกเพลงเพื่อสร้างภาพ Playlist |
| `/profile` | หน้าโปรไฟล์ - เข้าสู่ระบบ Spotify และตรวจสอบสถานะ Premium |

## เทคโนโลยี

- **Next.js 15** - App Router
- **React** - UI Framework
- **Tailwind CSS** - Styling
- **Spotify Web API** - ค้นหาเพลงและข้อมูลผู้ใช้
- **@dnd-kit** - Drag and Drop
- **Canvas API** - สร้างภาพ Playlist

## Environment Variables

ต้องตั้งค่า environment variables ดังนี้:

\`\`\`env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
\`\`\`

## การตั้งค่า Spotify Developer

1. ไปที่ [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. สร้าง App ใหม่
3. เพิ่ม Redirect URI: `https://your-domain.vercel.app/api/auth/callback`
4. คัดลอก Client ID และ Client Secret มาใส่ใน environment variables

## การใช้งาน

### หน้าหลัก (ไม่ต้อง Login)
1. พิมพ์ชื่อเพลงในช่องค้นหา
2. คลิกเพลงที่ต้องการเพิ่มลงใน Playlist (สูงสุด 12 เพลง)
3. ลากเพื่อเรียงลำดับเพลงตามต้องการ
4. กดปุ่ม "ดาวน์โหลดภาพ" เพื่อบันทึกภาพ Playlist

### หน้าโปรไฟล์ (ต้อง Login)
1. กดปุ่ม "เข้าสู่ระบบด้วย Spotify"
2. อนุญาตการเข้าถึงข้อมูล
3. ดูข้อมูลโปรไฟล์และสถานะ Premium

## โครงสร้างโปรเจกต์

\`\`\`
├── app/
│   ├── api/
│   │   ├── auth/callback/    # OAuth callback handler
│   │   └── spotify/token/    # Token endpoint
│   ├── profile/              # หน้าโปรไฟล์
│   ├── page.tsx              # หน้าหลัก
│   ├── layout.tsx            # Layout พร้อมฟอนต์ Kanit
│   └── globals.css           # Global styles
├── public/
│   └── template.jpg          # เทมเพลตภาพ Playlist
└── components/ui/            # UI Components
\`\`\`

## License

MIT
The BEUS Team
