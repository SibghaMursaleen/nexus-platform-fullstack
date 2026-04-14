# 🚀 Business Nexus: High-Fidelity Investment & Branding Ecosystem

**Business Nexus** is a professional, data-driven platform designed to connect visionary **Entrepreneurs** with high-stakes **Investors**. Built for scale, security, and premium user experience, the platform enables founders to refine their brand identity, secure funding, and collaborate in real-time. 🌠 💎 🛰️

## 🏆 Project Milestone Completion (1-7)

| Milestone | Feature | Status | Technical Architecture |
| :--- | :--- | :--- | :--- |
| **M1** | **Market Expansion** | ✅ **Complete** | Multi-Role Auth (Investor vs Entrepreneur) with JWT & RoleGuards. |
| **M2** | **Brand Identity Hub** | ✅ **Complete** | Dedicated full-page branding suite with Hero Banners & Pitch Previews. |
| **M3** | **Capital Flow Engine** | ✅ **Complete** | Atomic Wallet system with Mongoose Transactions & Stripe/Mock support. |
| **M4** | **Nexus Network** | ✅ **Complete** | Real-time Socket.io Messaging with persistent conversation history. |
| **M5** | **Pitch Deck Vault** | ✅ **Complete** | Secure Document Management with shared access & **Digital Signatures**. |
| **M6** | **Strategic Meetings** | ✅ **Complete** | Conflict-aware scheduling and auto-generated video collaboration rooms. |
| **M7** | **Security Perimeter** | ✅ **Complete** | **XSS/NoSQL Protection**, **Input Validation**, and the **2FA OTP Guard**. |

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Framer Motion (for smooth micro-animations). 🎨
- **Backend**: Node.js, Express, MongoDB Atlas, Socket.io (Real-time signaling). ⚙️
- **Security**: Bcrypt (Hashing), JWT (Sessions), Express-Validator (Sanitization), Helmet (Perimeter). 🛡️
- **Services**: Multer (File Uploads), Stripe (Payment logic), Nodemailer (Mock OTP). 📧

## 🚀 Installation & Launch Protocol

### 1. Environment Configuration 🛰️
Create a `.env` file in the `/backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_nexus_secure_key_777
STRIPE_SECRET_KEY=sk_test_optional
```

### 2. Frontend Launch 🎨
```bash
cd Nexus-main
npm install
npm run dev
```

### 3. Backend Launch ⚙️
```bash
cd backend
npm install
npm run dev
```

## 🛡️ Security & Testing Suite
Nexus is hardened against modern attack vectors:
- **XSS Protection**: All user bios and pitch summaries are escaped via `xss-clean` and `express-validator`. 🧼
- **NoSQL Guard**: Protects against injection attacks via `mongo-sanitize`. 🛡️
- **Nexus 2FA Guard**: (Optional) Secure OTP verification required for login when enabled. ✅

## 🌟 Current Status
All core milestones (M1-M7) including multi-role authentication, real-time messaging, and capital flow integrations (Investment Modal & Wallet) are now fully operational. The platform is staged and ready for demonstration.

---

**Built with Precision for the Next Generation of Global Startups.** 🛰️🚀🛸🎯
