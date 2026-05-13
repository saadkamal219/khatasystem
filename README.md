# Khata — Credit Management System

A simple shop credit tracking system. Customers can manage their credit accounts, and the shopkeeper (admin) can view everything and approve/reject edit requests.

---

## Project Structure

```
khata-system/
├── frontend/               → Host on GitHub Pages
│   ├── index.html          → Login page
│   ├── signup.html         → Registration page
│   ├── dashboard.html      → User account dashboard
│   ├── admin.html          → Admin view-only dashboard
│   ├── css/
│   │   ├── main.css        → Shared styles (layout, buttons, cards)
│   │   ├── auth.css        → Login/signup styles
│   │   ├── dashboard.css   → Dashboard styles
│   │   └── admin.css       → Admin-specific styles
│   └── js/
│       ├── config.js       → API URL + shared helper functions
│       ├── login.js        → Login page logic
│       ├── signup.js       → Signup page logic
│       ├── dashboard.js    → User dashboard logic
│       └── admin.js        → Admin dashboard logic
│
└── backend/                → Host on Render
    ├── server.js           → Main entry point
    ├── .env.example        → Copy to .env and fill in values
    ├── package.json
    ├── models/
    │   ├── User.js         → User schema (name, phone, balances)
    │   ├── Transaction.js  → Transaction records
    │   └── EditRequest.js  → Pending approval requests
    ├── middleware/
    │   └── auth.js         → JWT token verification
    └── routes/
        ├── auth.js         → POST /auth/login, /auth/signup
        ├── user.js         → GET /user/dashboard, POST /user/transaction
        ├── admin.js        → Admin-only views and approvals
        └── editRequest.js  → Submit/view edit requests
```

---

## Step 1: Set Up Backend on Render

### 1. Prepare the backend folder
```bash
cd backend
npm install
```

### 2. Create your .env file
```bash
cp .env.example .env
```
Edit `.env`:
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/khata_db
JWT_SECRET=pick_any_random_long_string_here
PORT=5000
ADMIN_PASSWORD=your_admin_password
ADMIN_USERNAME=admin
```

> **Note:** The admin account is NOT stored in MongoDB. It's defined in the `.env` file. To change the admin password, update `ADMIN_PASSWORD` in your `.env` on Render.

### 3. Push backend to GitHub (separate repo or subfolder)
Then on Render:
- New Web Service → connect your repo
- Build command: `npm install`
- Start command: `node server.js`
- Add all environment variables from `.env`

### 4. Copy your Render URL
It will look like: `https://khata-backend-xxxx.onrender.com`

---

## Step 2: Set Up Frontend on GitHub Pages

### 1. Update the API URL
Open `frontend/js/config.js` and change line 3:
```js
const API_BASE = "https://your-app-name.onrender.com/api";
//                ↑ Replace with your actual Render URL
```

### 2. Push frontend folder to GitHub
- Create a new GitHub repo
- Push everything inside the `frontend/` folder (not the folder itself, its contents)
- Go to repo Settings → Pages → Source: `main` branch, `/ (root)`
- Your site will be at: `https://yourusername.github.io/repo-name`

---

## Step 3: MongoDB Setup

In your MongoDB Atlas cluster, just connect with the URI in `.env`. The database `khata_db` and all collections will be **created automatically** on first use. No setup needed.

---

## How the System Works

### User Flow
1. User signs up with name, phone, password
2. User logs in → goes to their dashboard
3. Dashboard shows:
   - Total credit (goods taken on credit)
   - Total paid back
   - Remaining balance
   - Transaction history
4. User can directly add **Credit** (took goods) or **Payment** (paid back)
5. User can also submit an **Edit Request** (needs admin approval before it applies)
6. Users can see the status of their requests (pending / approved / rejected)

### Admin Flow
1. Admin logs in with username `admin` and the password set in `.env`
2. Admin sees:
   - All pending edit requests (with Approve/Reject buttons)
   - All customer accounts with their balances
   - View button to see any customer's full transaction history
3. Admin **cannot** directly add or change any transaction
4. When admin approves a request → the transaction is automatically applied

---

## API Endpoints Reference

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| POST | /api/auth/signup | Public | Create user account |
| POST | /api/auth/login | Public | Login (users + admin) |
| GET | /api/user/dashboard | User | Get balance + transactions |
| POST | /api/user/transaction | User | Add credit or payment |
| POST | /api/edit-request/submit | User | Submit edit request |
| GET | /api/edit-request/my-requests | User | View own requests |
| GET | /api/admin/users | Admin | All users + balances |
| GET | /api/admin/user/:id/transactions | Admin | One user's history |
| GET | /api/admin/edit-requests | Admin | All pending requests |
| POST | /api/admin/edit-request/:id/approve | Admin | Approve a request |
| POST | /api/admin/edit-request/:id/reject | Admin | Reject a request |

---

## Customization Tips

- **Change currency symbol**: Search for `৳` in `config.js` and replace with your symbol
- **Change admin credentials**: Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` on Render
- **Add more fields to users**: Edit `models/User.js` and `routes/auth.js`
- **Change colors**: Edit CSS variables at the top of `css/main.css`
