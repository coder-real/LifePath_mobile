# LiFePath

A mobile app that connects young people with mentors. Users sign up, set personal
goals, find a mentor, chat with them, and track their progress.

Built as a clean, working class project — not a production platform.

## Tech stack

| Layer | Tool |
|---|---|
| Mobile app | React Native + Expo |
| Backend | Supabase (database + auth + storage) |
| Language | TypeScript |
| Navigation | Expo Router (file-based routing + tabs) |
| State | React Context (auth) |
| Chat | Supabase (regular database queries, no realtime) |

## Features

- **Mentees:** sign up, set a profile, browse/search mentors by category, send a
  mentorship request, chat once accepted, and create goals with checkable milestones.
- **Mentors:** sign up, set a profile (headline, expertise, categories), accept or
  reject mentorship requests, and chat with mentees.

## Project structure

```
lifepath/
├── app/
│   ├── (auth)/           welcome, signup, login
│   ├── (mentee)/         home, mentors, chats, goals, profile + detail screens
│   └── (mentor)/         home, requests, mentees, profile + chat
├── components/           reusable UI (Button, Card, ChatScreen, ProfileEditor)
├── lib/                  Supabase client, theme
├── hooks/                useConversations, etc.
├── context/              AuthContext
├── types/                TypeScript types
└── supabase/schema.sql   Database schema + Row Level Security policies
```

## Getting started

1. **Create a Supabase project** at https://supabase.com.

2. **Run the schema.** In the Supabase dashboard open the **SQL editor**, paste the
   contents of `supabase/schema.sql`, and run it. This creates all tables, enables
   Row Level Security, adds a trigger that auto-creates a `profiles` row on signup,
   and creates the `avatars` storage bucket with its policies for profile photos.

   > Optional: enable Email confirmation off in **Auth → Providers → Email** so the
   > demo flow works instantly without confirming each account.

3. **Configure the app.**

   Copy `.env.example` to `.env` and fill in your project credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

   You can also set them under `extra` in `app.json` instead.

4. **Install and run.**

   ```bash
   npm install
   npx expo start
   ```

   Scan the QR code with **Expo Go** (or press `a` for Android / `i` for iOS).

## Building the app (package / APK)

This project is configured for **EAS Build** (Expo's cloud build service). You don't
need a local Android SDK.

1. Install the EAS CLI and log in with a free Expo account:

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. Build a shareable Android **APK** (installable on any Android phone):

   ```bash
   npm run build:apk        # or: eas build -p android --profile preview
   ```

   EAS will give you a link and build on Expo's servers. When it finishes, you can
   install the APK on a device or download it.

3. Build a Play Store bundle (AAB) or iOS:

   ```bash
   npm run build:aab        # Google Play .aab
   npm run build:ios        # requires a paid Apple Developer account
   ```

The Supabase URL and publishable key are baked into `app.json` (under `extra`), so the
built app talks to your live backend with no further setup.

## Trying the full flow

1. Sign up as a **Mentee** (or two accounts: one mentee, one mentor).
2. As a **Mentor**, fill in your mentor profile so you show up in search.
3. As the **Mentee**, find the mentor, send a request.
4. As the **Mentor**, accept the request (this creates a conversation).
5. Chat between the two accounts.
6. As the **Mentee**, create a goal and check off milestones.

## What's intentionally not built

Admin dashboard, AI matching, video calls, payments, push notifications, analytics,
group mentorship, and content/course marketplace — all good ideas for a future version.
