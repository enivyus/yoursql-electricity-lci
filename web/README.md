# YourSQL · เว็บนำเสนอข้อมูล

เว็บสำหรับแสดงข้อมูลจาก `db/lci.db` สร้างด้วย Vite + React + Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) และ Recharts

## หน้าในเว็บ (hash routing)

| หน้า | URL | สิ่งที่แสดง |
|---|---|---|
| สำรวจข้อมูล | `#/` | ค้นหาชุดข้อมูล, รายการชุดข้อมูลพร้อม “ช่วงข้อมูลและข้อควรรู้”, เส้นทางของไฟฟ้าแบบเลื่อนอ่าน (scrollytelling), สรุปคุณภาพข้อมูล |
| ชุดข้อมูล | `#/data/generation` · `capacity` · `system` | ตัวเลขสรุป, ข้อควรรู้, กราฟ, ตัวกรอง + ตาราง + ส่งออก CSV |
| LCI โรงไฟฟ้า | `#/data/lci` | ข้อมูลกระบวนการ SRC-08 และตาราง 31 รายการ |
| เส้นทางข้อมูล | `#/pipeline` | 5 ขั้นจากไฟล์ต้นทางถึงเว็บ, ผล Quality Gate, status_history |
| แหล่งข้อมูล | `#/sources` | แหล่งข้อมูล 10 แหล่งและสิทธิการใช้ |

คลิกแถวใดก็ได้ในตารางเพื่อเปิด Sheet “ตามรอย” ซึ่งแสดงตำแหน่งในต้นฉบับ ไฟล์ snapshot, SHA-256 และประวัติสถานะของแถวนั้น

คอมโพเนนต์ shadcn/ui ที่ใช้: Button, Card, Badge, Tabs, Table, Input, Select, Sheet, Collapsible, Dropdown Menu, Separator, Chart (Recharts)

## รันในเครื่อง

```bash
cd web
npm install
npm run dev          # เปิด http://localhost:5173
```

## อัปเดตข้อมูลหลังแก้ฐานข้อมูล

```bash
python web/scripts/export_data.py   # อ่าน db/lci.db (อ่านอย่างเดียว) → web/src/data/*.json
```

แล้ว commit ไฟล์ JSON ที่เปลี่ยน ทาง Vercel จะ build ใหม่ให้เอง

## Deploy บน Vercel

ใน Project Settings → Build & Deployment ให้ตั้ง **Root Directory = `web`**
ไฟล์ `vercel.json` กำหนด framework เป็น Vite, build ด้วย `npm run build` และใช้โฟลเดอร์ `dist` ไว้แล้ว

## เพิ่มคอมโพเนนต์ shadcn

มี `components.json` แล้ว จึงเพิ่มคอมโพเนนต์จาก ui.shadcn.com ได้ด้วยคำสั่ง เช่น

```bash
npx shadcn@latest add dialog
```
