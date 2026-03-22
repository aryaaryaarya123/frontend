# 🚀 Deploying Ledger to Render — Step by Step

## What you'll end up with
- A live URL like `https://ledger-app.onrender.com`
- All 3 of you can open it on any device (phone, laptop, etc.)
- Data stored in a real PostgreSQL database — survives everything

---

## Step 1 — Create a GitHub account (if you don't have one)
Go to https://github.com and sign up. It's free.

---

## Step 2 — Upload the project to GitHub

1. Go to https://github.com/new
2. Name the repo: `ledger-app`
3. Keep it **Private** (only you can see it)
4. Click **Create repository**
5. On the next screen, click **"uploading an existing file"**
6. Extract the `ledger-app.zip` you downloaded
7. Drag ALL the files into GitHub:
   - `server.js`
   - `package.json`
   - `render.yaml`
   - `.gitignore`
   - `public/index.html`  ← make sure to keep this in a `public` folder
8. Click **Commit changes**

---

## Step 3 — Create a Render account
Go to https://render.com and sign up with your GitHub account.

---

## Step 4 — Deploy using render.yaml (Blueprint)

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repo (`ledger-app`)
3. Render will automatically read `render.yaml` and create:
   - A **Web Service** (your Node.js app)
   - A **PostgreSQL database** (free tier)
4. Click **Apply**
5. Wait ~3 minutes for the build to finish

---

## Step 5 — Open your app
Once deployed, Render gives you a URL like:
```
https://ledger-app.onrender.com
```
Share this with Arya, Umanga, and Gaurav — everyone can use it!

---

## ⚠️ Free Tier Notes
- Render's free web service **spins down after 15 min of inactivity**
  → First load after idle may take 30–60 seconds (just wait, it wakes up)
- The free PostgreSQL database is available for **90 days**, then needs upgrading
  → Paid plan is $7/month if you want it permanent
- To avoid spin-down: upgrade to the $7/month "Starter" web service

---

## Troubleshooting

**Build fails?**
→ Check that `package.json` is in the root folder (not inside a subfolder)

**"Cannot connect to database"?**
→ In Render dashboard → your web service → Environment → make sure `DATABASE_URL` is set (it should be auto-set by render.yaml)

**Data not showing?**
→ Wait 30 seconds for the service to wake up, then refresh

---

## File structure that must be in GitHub
```
ledger-app/
├── server.js          ← Node.js backend
├── package.json       ← dependencies
├── render.yaml        ← Render deployment config
├── .gitignore
└── public/
    └── index.html     ← your frontend app
```
