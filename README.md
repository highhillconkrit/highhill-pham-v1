# Google Sign-In + Prisma

Login with a Google account; all user data (profile, sessions, linked
accounts) is stored and managed through Prisma.

## Stack
- Next.js 14 (App Router)
- NextAuth (Auth.js) — Google OAuth provider, database sessions
- Prisma — `@next-auth/prisma-adapter` persists users/accounts/sessions

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Google OAuth credentials**
   - Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   - Create an OAuth Client ID (type: Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret

3. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
   generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

4. **Database**
   ```bash
   npm run db:push      # create tables from prisma/schema.prisma
   npm run db:studio    # optional: browse data in a GUI
   ```

5. **Run it**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` → redirects to `/login`.

## How the pieces fit together

- `prisma/schema.prisma` — `User`, `Account`, `Session`, `VerificationToken`
  models. `User` has two custom fields (`bio`, `role`) you can extend.
- `lib/auth.ts` — NextAuth config: Google provider + `PrismaAdapter`, so
  every sign-in writes/updates a row in `User` and `Account` automatically.
- `app/login` — sign-in screen, redirects to `/dashboard` on success.
- `app/dashboard` — protected page that reads the user straight from
  Prisma (`prisma.user.findUniqueOrThrow`) and renders an editable panel.
- `app/api/user/route.ts` — `PATCH` to update profile fields, `DELETE`
  to remove the account and all related rows (cascades via the schema).

## Extending the User model

Add fields to `User` in `schema.prisma`, run `npm run db:push`, then
read/write them the same way `bio` is handled in `profile-panel.tsx`
and `app/api/user/route.ts`.
