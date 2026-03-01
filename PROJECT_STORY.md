# Recycle with Bandit — Project Story

## What inspired us

We wanted to make recycling feel less like a chore and more like something you do with a friend. We were inspired by habit-trackers that use streaks and social accountability, and by the idea that **small, consistent actions add up**: if each person recycles \(n\) items per week, then over \(m\) weeks the total impact is \(n \times m\) items kept out of landfills—and that scales with every friend who joins. We also wanted to avoid the friction of “create an account with email” and keep the app light and local-first where possible, so we focused on a simple username + one-time login code and optional ZIP-based recycling guidelines.

## What we learned

We learned how to design auth without email (using Supabase’s requirement for a unique email under the hood but surfacing only a username and a memorable code like `Sun-leaf-42!` to the user). We got hands-on with Supabase (Row Level Security, RPCs for friend-code lookups, migrations), TanStack Query for server state, and React Router with a base path for GitHub Pages. We also learned how much UX detail matters: guiding users through “mark as recycled” with per-item rules, pre-filling local setup from ZIP, and making the mascot (Bandit) and hats feel like a reward rather than a gimmick.

## How we built it

We built **Recycle with Bandit** as a Vite + React + TypeScript SPA with Tailwind and shadcn-style components. The backend is Supabase: Postgres for profiles, log entries, item types, and friend relationships; Auth for our synthetic-email username flow; and an Edge Function (optional) for ZIP-based recycling rules. We structured the app around a few core flows: **Home** (hero, signup/login, weekly total, nav), **Log** (search/batch items, item guidance drawer, “mark as recycled” with quantity), **Local Setup** (ZIP → fetch or default rules, stream and guidelines), **Stats** (rolling 7-day and lifetime totals, Bandit + hat picker, friend code, add/accept/deny friends), and **Friends** (list with usernames and 7-day totals). Custom art (Bandit, hats, recycling icon, buttons, home collage) and image-based nav and buttons give it a consistent, friendly look.

## Challenges we faced

**Auth and product copy:** Hiding “email” from the user while still satisfying Supabase’s auth was tricky; we had to turn off email confirmation and map all error messages so users only see username/code language. **Friend system:** We didn’t want to expose profile rows by friend code directly, so we added an RPC `get_user_id_by_friend_code(code)` and use that for “Add friend by code” to keep the data model and RLS correct. **Deployment:** Getting the app to run on GitHub Pages with client-side routing required setting `base` in Vite and `basename` in React Router to the repo path (e.g. `/recycle-habit-13374d6d/`). **Local rules:** Balancing “works offline” with “helpful ZIP-based rules” meant a clear fallback: try env API or Edge Function, then fall back to `DEFAULT_RECYCLING_RULES` and `DEFAULT_LOCAL_GUIDELINES` so the app always stays usable.

---

*Built with Vite, React, TypeScript, Supabase, TanStack Query, Tailwind CSS, React Router, and Radix UI.*
