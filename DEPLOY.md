# Deployment Instructions

Your application is ready to deploy! Because this is a secure process involving your passwords, you need to execute a few standard commands.

## Step 1: Push to GitHub

1.  **Create a New Repository** on GitHub (e.g., named `premier-traffic-system`).
    *   *Do NOT initialize with README, .gitignore, or License.*
2.  **Run these commands** in your terminal (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/premier-traffic-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1.  Go to [Vercel.com](https://vercel.com) and log in.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import from **GitHub**.
4.  Select the `premier-traffic-system` repository you just created.

## Step 3: Important - The Database

By default, this app uses **SQLite** (`dev.db`). Vercel does **NOT** support SQLite files effectively (your data will be deleted every time the app updates or sleeps).

**Recommended Fix for Production:**
1.  In Vercel, after importing the project, look for the **Storage** tab.
2.  Add a **Vercel Postgres** database.
3.  Vercel will automatically add the environment variables (`POSTGRES_URL`, etc.).
4.  You will need to update your `prisma/schema.prisma` file to use `postgresql` instead of `sqlite` if you do this.

**Alternative (Quickest Test):**
You can deploy it as-is, but be aware that **any bookings you make on the live website will disappear** when the site redeploys.

## Step 4: Environment Variables

In the Vercel Project Settings -> Environment Variables, add your Email settings:
*   `SMTP_HOST`
*   `SMTP_PORT`
*   `SMTP_USER`
*   `SMTP_PASS`
*   `SMTP_FROM`
