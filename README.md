# ระบบจัดการทีมโรงงาน (Factory Team Management System)

ระบบจัดการทีมสำหรับโรงงาน พัฒนาด้วย React + Node.js + SQLite รองรับการทำงานแบบ Real-time และใช้งานได้บน PC และ Tablet

## คุณสมบัติหลัก

- ✅ **Dashboard แบบ Real-time** - แสดงข้อมูลสรุปการทำงานแบบสดๆ
- ✅ **จัดการคำสั่งซื้อ (Order Management)** - สร้าง แก้ไข ติดตามสถานะคำสั่งซื้อ
- ✅ **จัดการสินค้าคงคลัง (Inventory Management)** - ติดตามจำนวนสินค้า แจ้งเตือนเมื่อใกล้หมด
- ✅ **ระบบ Login** - การยืนยันตัวตนผู้ใช้งาน
- ✅ **SQLite Database** - ฐานข้อมูลแบบไฟล์เดียว ง่ายต่อการติดตั้ง
- ✅ **Responsive Design** - รองรับการใช้งานบน PC และ Tablet
- ✅ **Real-time Updates** - อัปเดตข้อมูลแบบสดๆ ผ่าน WebSocket

## โครงสร้างระบบ

```
factory-management-system/
├── server/                 # Backend Node.js
│   ├── index.js           # เซิร์ฟเวอร์หลัก
│   ├── database/          # ฐานข้อมูล SQLite
│   ├── routes/            # API Routes
│   └── middleware/        # Middleware
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/         # Page Components
│   │   ├── services/      # API Services
│   │   ├── context/       # React Context
│   │   └── utils/         # Utility Functions
│   └── public/
├── database/              # ไฟล์ฐานข้อมูล
└── package.json           # Dependencies
```

## การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies ทั้งหมด
npm run install-all
```

### 2. สร้างฐานข้อมูล

ระบบจะสร้างฐานข้อมูล SQLite อัตโนมัติเมื่อรันครั้งแรก

### 3. สร้างผู้ใช้งานตัวอย่าง

เรียกใช้ script สร้างผู้ใช้งานตัวอย่าง:

```bash
node server/scripts/create-sample-users.js
```

## การรันระบบ

### โหมด Development (แนะนำสำหรับการพัฒนา)

```bash
npm run dev
```

คำสั่งนี้จะรันทั้ง Backend (port 5000) และ Frontend (port 3000) พร้อมกัน

### รันแยกส่วน

```bash
# รัน Backend เท่านั้น
npm run server

# รัน Frontend เท่านั้น  
npm run client
```

### โหมด Production

```bash
# Build Frontend
npm run build

# รัน Production Server
npm start
```

## การเข้าใช้งาน

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### บัญชีทดสอบ

| ชื่อผู้ใช้ | รหัสผ่าน | บทบาท |
|------------|----------|--------|
| admin | admin123 | ผู้ดูแลระบบ |
| worker | worker123 | พนักงาน |

## คุณสมบัติของระบบ

### Dashboard
- สถิติคำสั่งซื้อแบบ Real-time
- กราฟสถานะคำสั่งซื้อ
- แจ้งเตือนสินค้าใกล้หมด
- คำสั่งซื้อล่าสุด

### จัดการคำสั่งซื้อ
- สร้างคำสั่งซื้อใหม่
- อัปเดตสถานะคำสั่งซื้อ
- ดูประวัติการเปลี่ยนแปลง
- ค้นหาและกรองคำสั่งซื้อ

### จัดการสินค้าคงคลัง
- เพิ่ม/แก้ไข/ลบสินค้า
- ติดตามจำนวนสินค้าคงเหลือ
- แจ้งเตือนเมื่อสินค้าใกล้หมด
- ค้นหาสินค้า

### ระบบ Authentication
- Login/Logout
- JWT Token
- ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก

### Orders
- `GET /api/orders` - ดูคำสั่งซื้อทั้งหมด
- `POST /api/orders` - สร้างคำสั่งซื้อใหม่
- `PUT /api/orders/:id` - อัปเดตคำสั่งซื้อ
- `GET /api/orders/:id/history` - ดูประวัติคำสั่งซื้อ

### Inventory
- `GET /api/inventory` - ดูสินค้าคงคลังทั้งหมด
- `POST /api/inventory` - เพิ่มสินค้าใหม่
- `PUT /api/inventory/:id` - อัปเดตสินค้า
- `DELETE /api/inventory/:id` - ลบสินค้า
- `GET /api/inventory/low-stock` - ดูสินค้าใกล้หมด

### Dashboard
- `GET /api/dashboard/stats` - ข้อมูลสถิติ
- `GET /api/dashboard/recent-orders` - คำสั่งซื้อล่าสุด
- `GET /api/dashboard/low-stock-items` - สินค้าใกล้หมด
- `GET /api/dashboard/order-status-chart` - ข้อมูลกราฟ

## Technology Stack

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **SQLite3** - Database
- **Socket.io** - Real-time Communication
- **JWT** - Authentication
- **bcryptjs** - Password Hashing

### Frontend
- **React 18** - UI Framework
- **React Router** - Routing
- **TailwindCSS** - CSS Framework
- **Socket.io Client** - Real-time Client
- **Axios** - HTTP Client
- **Recharts** - Charts
- **Lucide React** - Icons

## การปรับแต่ง

### Environment Variables
แก้ไขไฟล์ `.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database/factory.db
```

### เปลี่ยน Port
- Backend: แก้ไข `PORT` ใน `.env`
- Frontend: แก้ไข `proxy` ใน `client/package.json`

## การ Deploy

### Build สำหรับ Production
```bash
npm run build
```

### รันบน Server
```bash
npm start
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Port ถูกใช้งานแล้ว**
   ```bash
   # หา Process ที่ใช้ Port
   netstat -ano | findstr :3000
   netstat -ano | findstr :5000
   
   # ปิด Process
   taskkill /PID <PID> /F
   ```

2. **Database Error**
   - ตรวจสอบว่าโฟลเดอร์ `database` มีอยู่จริง
   - ตรวจสอบสิทธิ์การเขียนไฟล์

3. **Module Not Found**
   ```bash
   npm install
   cd client && npm install
   ```

## License

MIT License

## ติดต่อ

สำหรับข้อสงสัยหรือต้องการสนับสนุนเพิ่มเติม กรุณาติดต่อทีมพัฒนา
