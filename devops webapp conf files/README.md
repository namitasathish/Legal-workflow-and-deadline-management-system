# ⚖️ Indian Judicial System
## Automated Case Tracking & Anonymous Case Filing
> **DevOps Course Demonstration Project** | Built by University Students

---

## 📁 Folder Structure

```
indian-judicial-system/
│
├── backend/                    ← Node.js + Express API
│   ├── models/
│   │   └── Case.js             ← MongoDB schema (blueprint for a case)
│   ├── routes/
│   │   ├── caseTracker.js      ← GET /api/case/:id
│   │   ├── caseFiling.js       ← POST /api/file-case
│   │   └── admin.js            ← GET /api/admin/cases
│   ├── tests/
│   │   ├── caseTracker.test.js ← Jest tests for tracking
│   │   └── caseFiling.test.js  ← Jest tests for filing
│   ├── server.js               ← Main Express app entry point
│   ├── seed.js                 ← Adds demo data to MongoDB
│   ├── package.json            ← Dependencies & scripts
│   ├── .env                    ← Environment variables (PORT, MONGO_URI)
│   └── .eslintrc.json          ← Code linting rules
│
├── frontend/                   ← Static HTML/CSS/JS
│   ├── index.html              ← Main user page
│   ├── admin.html              ← Admin panel
│   ├── css/
│   │   └── style.css           ← All styling (navy blue theme)
│   └── js/
│       ├── app.js              ← Main page JS (track + file)
│       └── admin.js            ← Admin panel JS
│
├── Jenkinsfile                 ← CI/CD pipeline (stops at testing)
├── .gitignore
└── README.md                   ← You are here!
```

---

## 🚀 How to Run Locally (VS Code)

### Prerequisites
Make sure you have these installed:
- Node.js (v18 or later) → https://nodejs.org
- MongoDB Community Server → https://www.mongodb.com/try/download/community
- VS Code → https://code.visualstudio.com

### Step 1: Clone / Download the Project
```bash
git clone https://github.com/YOUR_USERNAME/indian-judicial-system.git
cd indian-judicial-system
```

### Step 2: Start MongoDB
```bash
# On Windows (run in a new terminal)
mongod

# On Mac/Linux
brew services start mongodb-community
# OR
mongod --dbpath /your/data/directory
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 4: Seed Demo Data (Optional but Recommended)
```bash
node seed.js
```
This adds 4 demo cases you can use to test the app immediately.

### Step 5: Start the Backend Server
```bash
npm start
# OR for hot-reload during development:
npm run dev
```
Server will start at: http://localhost:5000

### Step 6: Open the Frontend
Open `frontend/index.html` in your browser, OR use VS Code's Live Server extension.

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Expected output:
```
 PASS  tests/caseFiling.test.js
 PASS  tests/caseTracker.test.js

Test Suites: 2 passed
Tests:       15+ passed
Coverage:    Routes & Models
```

### Running Only Lint
```bash
npm run lint
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check — is server alive? |
| GET | `/api/case/:id` | Track a case by Case ID |
| POST | `/api/file-case` | File an anonymous complaint |
| GET | `/api/admin/cases` | View all cases (admin) |
| GET | `/api/admin/stats` | Dashboard stats |
| PATCH | `/api/admin/cases/:id/status` | Update case status |

### Example: Track a Case
```bash
curl http://localhost:5000/api/case/IJC-DEMO01-PEND01
```

### Example: File a Case
```bash
curl -X POST http://localhost:5000/api/file-case \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bribery at RTO Office",
    "description": "The officer demanded Rs 500 to process my vehicle documents.",
    "category": "Bribery"
  }'
```

---

## 🧬 MongoDB Schema (Case Model)

```javascript
{
  caseId:          String (UUID-based, e.g., "IJC-ABCD12-EF3456"),
  title:           String (required, max 200 chars),
  description:     String (required, max 2000 chars),
  category:        "Corruption" | "Misconduct" | "Harassment" | "Bribery" | "Other",
  status:          "Pending" | "Hearing Scheduled" | "Under Review" | "Closed",
  complainantName: String (default: "Anonymous"),
  filedAt:         Date,
  lastUpdated:     Date,
  hearingDate:     Date,
  court:           String,
  judge:           String,
  nextAction:      String
  // NOTE: IP address is NEVER stored — privacy first!
}
```

---

## 🏗️ Jenkins Pipeline Overview

The `Jenkinsfile` defines 5 stages:

| Stage | What It Does |
|-------|-------------|
| 1. Pull from GitHub | Checks out latest code from repo |
| 2. Install Dependencies | Runs `npm install` |
| 3. Run Lint | Runs ESLint to catch code issues |
| 4. Run Unit Tests | Runs Jest — **THIS IS THE LAST REAL STAGE** |
| 5. Build | Syntax verification only — NO deployment |

> ⛔ **Pipeline intentionally stops after the TESTING phase** as per DevOps course requirements.

### Setting Up Jenkins
1. Install Jenkins locally or use a Jenkins server
2. Create a new Pipeline job
3. Set the pipeline source to your GitHub repo
4. Jenkins will automatically pick up the `Jenkinsfile`
5. Trigger a build manually or set up a GitHub webhook

---

## 🔐 Security Features

- **UUID-based Case IDs**: Cannot be guessed or reverse-engineered
- **No IP Storage**: We never store IP addresses — ever
- **Optional Name**: Complainants can remain 100% anonymous
- **Input Validation**: Both frontend and backend validate all inputs
- **CORS Enabled**: API accepts only configured origins

---

## 🎯 Demo Case IDs (After Running seed.js)

| Case ID | Status |
|---------|--------|
| `IJC-DEMO01-PEND01` | Pending |
| `IJC-DEMO02-HEAR01` | Hearing Scheduled |
| `IJC-DEMO03-CLOS01` | Closed |
| `IJC-DEMO04-REV01` | Under Review |

---

## 📚 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (with Mongoose ODM) |
| Testing | Jest, Supertest |
| Linting | ESLint |
| CI/CD | Jenkins |
| Version Control | Git + GitHub |
| Security | UUID (uuid package) |

---

*Built with ❤️ by University Students for DevOps Course Demonstration*
