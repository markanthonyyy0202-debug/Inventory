# Site Inventory Tracker (Next.js + Supabase + Vercel)

Central database, real-time sync (no login), audit log, reports (Excel/CSV/PDF), mobile-first.

## 1. Create the Supabase project
1. Go to https://supabase.com → sign up → **New project** (name: `inventory`, choose a region near you, set a database password, save it).
2. Wait ~2 minutes until the project is ready.

## 2. Create tables, security (RLS) and demo data
1. Supabase → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/schema.sql` → **Run**. This creates the tables, indexes, the balance view, RLS policies, audit triggers, real-time publication and demo data.

## 3. Get your keys
Supabase → **Project Settings → API**. Copy **Project URL** and the **anon public** key. (Never use the `service_role` key in this app.)

## 4. No login
There are no accounts. Anyone who opens the link enters their name once (saved on their phone/computer) and it is stamped on everything they add. Tap the name in the top bar to change it.
**Security note:** anyone who has the link can view and edit the data, so only share it inside your team. If you later want a password, it can be added.

## 5. Run locally (optional)
```
cp .env.example .env.local     # paste the URL and anon key
npm install
npm run dev                    # http://localhost:3000
```

## 6. Deploy to Vercel
1. Put this folder in a GitHub repo (github.com → New repository → upload the files).
2. https://vercel.com → sign up with GitHub → **Add New → Project** → import the repo (Framework: Next.js is auto-detected).
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
4. Click **Deploy**.

## 7. Get and share the public URL
- After the build, Vercel shows your URL, e.g. `https://inventory-ourcompany.vercel.app`. To choose the name: Project → Settings → Domains → edit the `.vercel.app` name.
- Open **Settings → Share System** → **Copy link** or **Share via WhatsApp** (the share icon in the top bar also copies the link).

## Notes
- Balances are computed from transactions (view `stock_balances`), so nothing is calculated by hand. Opening stock = a *Received* transaction.
- Movement rules: Site→Office etc. need From + To; Received/Returned/Adjustment use one location (Adjustment may be negative); Issued reduces the location.
- Deletions ask for confirmation and are logged in the Audit Log with the person's name.
- Supabase free projects pause after ~1 week of no activity; open the dashboard to resume.
