# Divya Chadha's Lab — Vercel edition

Same site as before (plain HTML/CSS/JS frontend, owner-only editing), rebuilt
so it runs on **Vercel**:

- `public/` — the frontend, unchanged.
- `api/*.js` — the backend, rewritten as Vercel serverless functions (each
  file is one endpoint) instead of one long-running Express server.
- **Storage** — this is the one real change. Vercel's servers don't have a
  writable disk that survives between requests, so `data/profile.json` is
  replaced with **Vercel KV** (a small free Redis database you attach to the
  project with a couple of clicks). Everything else behaves the same:
  anyone can view the site, only you can edit it after signing in.

## 1. One-time setup

You'll need a free [GitHub](https://github.com) account and a free
[Vercel](https://vercel.com) account (sign up with GitHub — it's one click).

**Generate your password hash and secret** (needs [Node.js](https://nodejs.org) installed locally):

```bash
cd vercel-divya-lab
npm install
node scripts/hash-password.js "yourChosenPassword"
```

This prints something like `ADMIN_PASSWORD_HASH=$2a$10$....` — save that.
Also generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save that too — it becomes `JWT_SECRET`.

## 2. Push the code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/divya-chadha-lab.git
git push -u origin main
```

## 3. Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
   you just pushed. Vercel auto-detects it (no build step needed) — just
   click **Deploy**. It will go live immediately at a URL like
   `https://divya-chadha-lab.vercel.app`, but editing won't work yet.

2. **Add a KV store** (this is what makes your edits actually save):
   - In your new project, go to the **Storage** tab → **Create Database** →
     **KV** (powered by Upstash, free tier is plenty for this).
   - Click **Connect** to link it to this project. Vercel automatically adds
     the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables for
     you — no copy-pasting needed.

3. **Add your other environment variables**: Project → **Settings** →
   **Environment Variables**, add:
   - `JWT_SECRET` = the random string from step 1
   - `ADMIN_PASSWORD_HASH` = the hash from step 1 (paste the whole
     `$2a$10$...` value, without the `ADMIN_PASSWORD_HASH=` prefix)
   - `NODE_ENV` = `production`

4. Go to the **Deployments** tab and click **Redeploy** on the latest one so
   the new environment variables take effect.

Your site is now live at the `.vercel.app` URL shown on the project's
Overview page — that's the link you can open and share.

## 4. Day-to-day use

- Visit your URL. Anyone can browse Home / GenAI Prototypes / R&D / Research.
- To edit: scroll to the footer → **Owner sign in** → enter your password →
  the **Edit profile** button appears in the top bar. Edit any text directly
  on the page, add/remove entries, then click **Done editing**.
- Your session stays signed in for 30 days on that browser/device.
- Forgot your password? Generate a new hash with
  `node scripts/hash-password.js "newPassword"`, update
  `ADMIN_PASSWORD_HASH` in Vercel's Environment Variables, then redeploy.

## 5. (Optional) Use your own domain

Project → **Settings** → **Domains** → add your domain (e.g.
`divyachadha.com`) and follow Vercel's DNS instructions. It's free — Vercel
handles the SSL certificate automatically.

## Prefer not to deal with a database at all?

If you'd rather skip the KV setup, the original version of this app
(plain Express server + a JSON file on disk) works as-is on a host with
persistent disk, like **Railway** or **Fly.io** — ask if you'd like that
version instead.
