# TabTally

Shared expense tracker with admin approvals, daily splits, history, and settlements.

![TabTally Screenshot](public/screen.png)

## Features
- Auth with admin approvals and optional admin signup secret.
- Record expenses with participants and equal splits.
- Daily summary, pairwise balances, and history view.
- Monthly history view + category filters.
- Settlements flow (per user and per day).

## Tech
- Next.js App Router + TypeScript
- MongoDB + Mongoose
- Zod validation
- JWT cookie sessions

## Environment
Create `.env.local`:

```bash
MONGODB_URI="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/tabtally?retryWrites=true&w=majority"
JWT_SECRET="replace-with-long-random-string"
ADMIN_SIGNUP_SECRET="replace-with-admin-secret"
```

## Dev
```bash
npm install
npm run dev
```

## Pages
- `/` Landing
- `/signup` Sign up
- `/signin` Sign in
- `/expenses` Record expenses + daily summary
- `/history` Daily history + monthly view
- `/history/[date]` Day detail
- `/admin` Approve users (admin only)
- `/settlements` Unsettled days + settle actions
