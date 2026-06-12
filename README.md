# Smart Public Grievance Redressal Portal

An AI-powered public grievance management system with Citizen, Officer, and Admin roles.

---

## 🚀 Quick Start

### Option 1 — One-command start
```bash
bash start.sh
```

### Option 2 — Manual start

**Step 1: Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**Step 2: Initialize the database** *(only needed first time)*
```bash
python3 database/init_db.py
```

**Step 3: Start the Flask backend**
```bash
cd backend
python3 app.py
# Runs on http://localhost:5000
```

**Step 4: Start the React frontend** *(in a new terminal)*
```bash
cd frontend
npm install   # first time only
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Login Credentials

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Citizen | citizen@example.com          | citizen123  |
| Officer | officer@grievance.gov        | officer123  |
| Admin   | admin@grievance.gov          | admin123    |

Additional officers (all use password `officer123`):
- priya.officer@grievance.gov
- amit.officer@grievance.gov  
- sunita.officer@grievance.gov

---

## 📋 Features

- **Citizens**: File complaints, upload photos, track status with timeline
- **Officers**: View assigned complaints, update status, submit resolutions
- **Admin**: Dashboard analytics, manage officers, oversee all complaints
- **AI**: Auto-summary and reply generation (requires ANTHROPIC_API_KEY env variable)

---

## ⚙️ Environment Variables

For AI features, set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=your_key_here
```
The portal works without it — AI features gracefully fall back to static text.

---

## 🔄 Reset Database

To wipe and re-seed the database:
```bash
rm database/grievance.db
python3 database/init_db.py
```
