# Portl Society

Portl Society is a society management mobile app for Indian residential communities. Residents approve visitors, pay dues, book amenities, and raise complaints. Guards manage gate entry and scan pre-approval QR codes. Admins run the society control center.

Built with **Expo SDK 55**, **React Native**, **Expo Router**, **Supabase**, and payments with **Razorpay**.

## Repository

[nikhild64/expo-portl](https://github.com/nikhild64/expo-portl)

## Demo credentials

After seeding the database (see Setup), sign in with:

| Role | Email | Password |
|------|-------|----------|
| Resident | `resident@portl.demo` | `Portl@123` |
| Guard | `guard@portl.demo` | `Portl@123` |
| Admin | `admin@portl.demo` | `Portl@123` |

## Stack

- **App:** Expo 55, React Native 0.83, Expo Router (file-based routes), Uniwind (Tailwind v4)
- **State & data:** Zustand (auth), TanStack React Query, Supabase JS client
- **Backend:** Supabase Postgres + RLS, Storage, Edge Functions, pg_cron
- **Payments:** Razorpay (test mode)
- **Push:** Expo Notifications + Firebase (via `push-fanout` edge function)

## Prerequisites

- [Bun](https://bun.sh) 1.x
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Android Studio (emulator) or a physical device
- [EAS CLI](https://docs.expo.dev/build/setup/) for production builds

## Setup

1. **Clone and install**

   ```bash
   bun install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:

   ```bash
   cp .env.example .env
   ```

   For local Supabase, also add `SUPABASE_SERVICE_ROLE_KEY` (used by `scripts/create-demo-users.mjs`).

3. **Database**

   ```bash
   supabase db reset
   bun scripts/create-demo-users.mjs
   ```

4. **Run the app**

   ```bash
   bun start        # Expo dev server
   bun android      # Run on Android emulator/device
   ```

5. **Tests**

   ```bash
   bun test
   ```

## Project structure

```
src/
  app/              # Expo Router screens (resident, guard, admin, auth)
  components/       # Shared UI primitives
  features/         # Screen logic grouped by domain
  lib/              # Helpers, Supabase client, hooks
  queries/          # React Query hooks
  stores/           # Zustand stores (auth)
supabase/
  migrations/       # Postgres schema + RLS
  functions/        # Edge functions (Razorpay webhook, push fanout)
scripts/            # Demo user seeding, push test utilities
docs/design/        # UI reference screenshots
```

## Architecture

```mermaid
flowchart TB
  subgraph client [Expo App]
    Router[Expo Router]
    RQ[React Query]
    Auth[authStore]
    Router --> RQ
    Auth --> RQ
  end

  subgraph supabase [Supabase]
    PG[(Postgres + RLS)]
    Storage[Storage buckets]
    Edge[Edge Functions]
    Cron[pg_cron jobs]
  end

  subgraph external [External]
    RZP[Razorpay]
    FCM[Firebase / Expo Push]
  end

  RQ --> PG
  RQ --> Storage
  Edge --> PG
  Cron --> PG
  RZP -->|webhook| Edge
  Edge --> FCM
```

### Key flows

- **Visitor entry:** Guard creates a visitor request → resident gets a push → approves/rejects in-app → guard marks entry at gate.
- **Pre-approval QR:** Resident shares a QR → guard scans → `consume_preapproval` RPC atomically creates the visitor record.
- **Dues:** Admin generates a monthly cycle → residents pay via Razorpay → webhook marks payment captured and updates dues.
- **Amenities:** Resident books a slot → optional Razorpay payment → booking confirmed on capture.

## Demo walkthrough

The recommended demo tells one connected story across all three roles:

```mermaid
sequenceDiagram
    autonumber
    participant G as Security Guard
    participant P as Portl Platform
    participant R as Resident
    participant A as Society Admin

    G->>P: Register delivery visitor
    P-->>R: Send approval request and push notification
    R->>P: Review visitor details
    R->>P: Approve entry
    P-->>G: Approval appears at the gate
    G->>P: Verify approval and mark visitor entered
    P-->>R: Update visitor status and history
    A->>P: Open live dashboard
    P-->>A: Show visitor activity, complaints, dues, and bookings
    A->>P: Publish a society notice or poll
    P-->>R: Deliver the community update
```

## Install the app

- **Google Play:** [Install Portl Society from Google Play](https://play.google.com/store/apps/details?id=com.nikhild64.portl)
- **APK download:** [Download APK from Google Drive](https://drive.google.com/file/d/1Fz-9mkIw_ZdJBa9BwMcStfLX6rsX8p17/view?usp=sharing)


### Demo video

[Demo video (YouTube)](https://youtu.be/G3EJmfOeZI8)

### Screenshots

| Screen | Screenshot |
|--------|------------|
| Onboarding / sign in | ![Onboarding and sign in](assets/screenshots-video/screen-auth-onboarding.png) |
| Resident home | <img src="assets/screenshots-video/screen-resident-home.png" alt="Resident home" width="240" height="520" /> |
| Visitor approval | <img src="assets/screenshots-video/screen-visitor-approval.png" alt="Visitor approval" width="240" height="520" /> |
| Pre-approval QR | <img src="assets/screenshots-video/screen-preapprove-qr.png" alt="Pre-approval QR" width="240" height="520" /> |
| Guard dashboard / entry | <img src="assets/screenshots-video/screen-guard-home-entry.png" alt="Guard dashboard and entry" width="240" height="520" /> |
| Community notices and polls | <img src="assets/screenshots-video/screen-community-notices-polls.png" alt="Community notices and polls" width="240" height="520" /> |
| Amenity booking | <img src="assets/screenshots-video/screen-amenity-booking.png" alt="Amenity booking" width="240" height="520" /> |
| Payments / dues | <img src="assets/screenshots-video/screen-payments-dues.png" alt="Payments and dues" width="240" height="520" /> |
| Admin dashboard | <img src="assets/screenshots-video/screen-admin-dashboard.png" alt="Admin dashboard" width="240" height="520" /> |
| Admin manage issues | <img src="assets/screenshots-video/screen-admin-manage-issues.png" alt="Admin manage issues" width="240" height="520" /> |

## Related docs

- [Expo SDK 55 docs](https://docs.expo.dev/versions/v55.0.0/)
- [Supabase local development](https://supabase.com/docs/guides/local-development)

## License

Private — all rights reserved.
