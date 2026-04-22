# Chill Calendar — Deployment Guide

This guide explains how to deploy the **Chill Calendar** app to Vercel with a managed Postgres database.

## 1. Prepare for Deployment
Ensure your code is pushed to a GitHub repository.

## 2. Create Vercel Project
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.

## 3. Set up Vercel Postgres
1. In your project dashboard on Vercel, click the **Storage** tab.
2. Select **Connect Database** → **Create New** → **Postgres**.
3. Accept the terms and click **Create**.
4. Choose a region close to you (e.g., Washington D.C. for US East).
5. Once created, click **Connect**. This will automatically add the required environment variables (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc.) to your project.

## 4. Environment Variables
Vercel automatically injects the database URLs. If you want to run the app locally:
1. Go to **Settings** → **Environment Variables**.
2. Copy the values of `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.
3. Create a `.env` file locally and paste them there.

## 5. First Deployment
1. Go to the **Deployments** tab.
2. If your first build failed because the database wasn't ready, click **Redeploy**.
3. The `npm run build` command (configured as `prisma generate && next build`) will run automatically.
4. Once finished, your app will be live at a `.vercel.app` URL!

## 6. Database Migrations
Since we are using Prisma, you need to push your schema to the live database:
1. Locally, run: `npx prisma db push`
   *(Make sure your `.env` file has the live Vercel Postgres URLs)*
2. This will sync your `schema.prisma` with the Vercel Postgres instance.

---
### Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS (Light Theme)
- **Database**: Vercel Postgres / Supabase
- **ORM**: Prisma
