<div align="center">

<img src="./assets/banner.svg" alt="Riverflow Q&A Platform Banner" width="100%" />

# Riverflow Q&A Platform

**A full-stack, developer-focused Question & Answer community built with Next.js, TypeScript and Appwrite.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-0ea5e9?style=for-the-badge&logo=vercel&logoColor=white)](https://riverflow-qna-platform.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nishit-soni-01/riverflow-qna-platform)

![Next.js](https://img.shields.io/badge/Next.js-16.4.2-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=flat-square&logo=appwrite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State-443E38?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Authentication Setup (OAuth)](#-authentication-setup-oauth)
- [Deployment](#-deployment)
- [Security](#-security)
- [Challenges & Solutions](#-challenges--solutions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🚀 About the Project

**Riverflow** is a StackOverflow-inspired Q&A platform where developers and learners can ask technical questions, share answers, discuss through comments, and vote on helpful contributions.

Next.js powers the frontend and server-side API routes, while **Appwrite** provides authentication, structured data (TablesDB) and file storage. The app is fully responsive and deployed on Vercel.

🔗 **Live website:** [https://riverflow-qna-platform.vercel.app](https://riverflow-qna-platform.vercel.app)

---

## 📸 Screenshots

> Place your images inside `docs/screenshots/` using the file names below (or update the paths).

### Home / Questions Feed
<p align="center">
  <img width="1662" height="873" alt="image" src="https://github.com/user-attachments/assets/6ebfbbaa-7c87-4aa6-b101-df64e9799b9e" />
</p>

### Question Detail
<p align="center">
  <img width="1713" height="882" alt="image" src="https://github.com/user-attachments/assets/088c63ff-4ab2-4204-9ea0-1a2db830d09e" />

</p>

### Ask a Question
<p align="center">
  <img width="1696" height="868" alt="image" src="https://github.com/user-attachments/assets/038d89b4-cd40-43a5-8b00-9f90d6686564" />
</p>

### Authentication
<table>
  <tr>
    <td align="center"><b>Login</b><br/><img width="1860" height="876" alt="image" src="https://github.com/user-attachments/assets/79b0d6ea-4319-48b8-8ba3-0c49ec754f6d" />
</td>
    <td align="center"><b>Register</b><br/><img width="1770" height="833" alt="image" src="https://github.com/user-attachments/assets/2573c1be-e39d-4fb3-8799-3292bb55d70d" />
</td>
  </tr>
</table>

### Tags & User Profile
<table>
  <tr>
    <td align="center"><b>Tags</b><br/><img width="1685" height="750" alt="image" src="https://github.com/user-attachments/assets/f75b2459-424e-4c4f-b777-e6903955606f" />
</td>
    <td align="center"><b>User Profile</b><br/><img width="1728" height="856" alt="image" src="https://github.com/user-attachments/assets/23a82a5f-0020-4a69-b6ea-aadf0bac90df" />
</td>
  </tr>
</table>

### Mobile Responsive
<p align="center">
   <img width="200" height="500" alt="pic11" src="https://github.com/user-attachments/assets/d5af3a58-de2a-40d4-9b1f-f92c8e2ea474" />
   <img width="200" height="500" alt="pic22" src="https://github.com/user-attachments/assets/5fc4f07f-54a5-4a42-acd1-163639873d3f" />
   <img width="200" height="500" alt="pic33" src="https://github.com/user-attachments/assets/e8a4dde1-faf8-4fe3-9889-927f6101212e" />
   <img width="200" height="500" alt="pic44" src="https://github.com/user-attachments/assets/3224ffaa-ba81-4464-8c49-eacacb6e95a3" />
   <img width="200" height="500" alt="pic55" src="https://github.com/user-attachments/assets/5dd44d4d-27d9-405e-a11f-1531c8baf902" />
   <img width="200" height="500" alt="pic66" src="https://github.com/user-attachments/assets/ad95b024-8653-4de2-bc1e-b482390a0773" />
   <img width="200" height="500" alt="pic77" src="https://github.com/user-attachments/assets/58828d83-b667-4936-9306-f4faecebde27" />




</p>

---

## ✨ Features

### 🔐 Authentication
- Email & password registration and login
- **Google OAuth** and **GitHub OAuth** sign-in
- Persistent, session-based authentication (survives page refresh)
- Secure logout by deleting the active session
- OAuth success/failure redirects
- Works on desktop and mobile browsers (tested on Chrome for Android)

### ❓ Questions
- Ask and browse technical questions
- Organize questions with **tags**
- Dedicated question detail page with author info and dates
- Question view tracking via a dedicated API route
- Optional file attachments (Appwrite Storage)

### 💬 Answers, Comments & Votes
- Multiple answers per question
- Accepted-answer support (`isAccepted` / `acceptedAnswerId`)
- Separate `comments` and `votes` tables for structured discussion and voting data

### 🏷️ Tags
- Dedicated `/tags` page that aggregates tags from the most recent questions

### 👤 User Profiles
- Public profile pages
- Reputation endpoint
- **Profile avatar** upload, edit and removal using Appwrite Storage
- Current-user API (`/api/users/me`)

### 🔔 Notifications
- Notification API route backed by a dedicated Appwrite table

### 🎨 UI / UX
- Responsive layout for desktop, tablet and mobile
- Clean, modern interface styled with Tailwind CSS v4

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16.4.2** | React framework, App Router, API routes |
| **React** | Component-based UI |
| **TypeScript** | Type safety and maintainability |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui + Base UI** | Reusable, accessible UI components |
| **Appwrite Account API** | Authentication and sessions |
| **Appwrite TablesDB** | Questions, answers, comments, votes, notifications |
| **Appwrite Storage** | Profile avatars and question attachments |
| **Zustand + Immer** | Client-side state management |
| **Lucide React** | Icons |
| **Vercel** | Hosting and CI/CD |
| **Google & GitHub OAuth** | Social login |

---

## 🏗 System Architecture

```text
User Browser
     |
     v
Next.js Application
     |
     +----------------------+
     |                      |
     v                      v
Frontend Pages         API Routes
     |                      |
     +-----------+----------+
                 |
                 v
          Appwrite SDK
                 |
       +---------+----------+
       |         |          |
       v         v          v
   Account    TablesDB    Storage
       |         |          |
       v         v          v
 Authentication Questions  Avatars
             Answers       Attachments
             Comments
             Votes
             Notifications
```

- **Frontend:** Next.js App Router pages and React components
- **State:** Zustand store for authentication state
- **Backend services:** Appwrite (auth, database, storage)
- **Server operations:** Next.js route handlers under `src/app/api`

---

## 🗄 Database Design

Riverflow uses **Appwrite TablesDB**.

| Table | Purpose |
|---|---|
| `questions` | Questions created by users |
| `answers` | Answers linked to questions |
| `comments` | Comments on questions/answers |
| `votes` | Voting records |
| `notifications` | User notifications |

**Questions:** `title`, `content`, `authorId`, `tags`, `acceptedAnswerId`, optional attachment reference

**Answers:** `content`, `questionId`, `authorId`, `isAccepted`

### Storage Buckets

| Bucket | Purpose |
|---|---|
| `question-attachment` | Question attachments |
| Profile avatar bucket | User profile avatars |

All resource identifiers are centralized in `src/models/name.ts`.

---

## 📁 Project Structure

```text
stackoverflow-appwrite/
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── env.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── ask-question/
│   │   │   │   └── page.tsx
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── tags/
│   │   │   │   └── page.tsx
│   │   │   └── users/
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   └── api/
│   │       ├── notifications/
│   │       │   └── route.ts
│   │       ├── questions/
│   │       │   └── [id]/
│   │       │       └── view/
│   │       │           └── route.ts
│   │       └── users/
│   │           ├── me/
│   │           │   ├── route.ts
│   │           │   └── avatar/
│   │           │       └── route.ts
│   │           └── [id]/
│   │               ├── route.ts
│   │               └── reputation/
│   │                   └── route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── auth-initializer.tsx
│   │   │   ├── header.tsx
│   │   │   ├── notification-bell.tsx
│   │   │   ├── right-rail.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── questions/
│   │   │   ├── comments-section.tsx
│   │   │   ├── question-card.tsx
│   │   │   ├── question-feed.tsx
│   │   │   ├── question-list-skeleton.tsx
│   │   │   ├── questions-page.tsx
│   │   │   └── vote-control.tsx
│   │   ├── shared/
│   │   │   ├── empty-state.tsx
│   │   │   └── time-ago.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── sonner.tsx
│   │   └── users/
│   │       └── author-profile.tsx
│   ├── lib/
│   │   ├── questions.ts
│   │   ├── rate-limit.ts
│   │   └── utils.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── name.ts
│   │   ├── client/
│   │   │   ├── answer.ts
│   │   │   ├── config.ts
│   │   │   ├── notifications.ts
│   │   │   ├── questions.ts
│   │   │   └── votes.ts
│   │   └── server/
│   │       ├── answer.collection.ts
│   │       ├── auth.ts
│   │       ├── comment.collection.ts
│   │       ├── config.ts
│   │       ├── dbSetup.ts
│   │       ├── question.collection.ts
│   │       ├── storageSetup.ts
│   │       └── vote.collection.ts
│   └── store/
│       └── Auth.ts
├── .env                         # local environment file; do not commit secrets
├── .env.local                   # local environment file; do not commit secrets
├── .gitignore
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── project-structure.txt
├── README.md
├── setup-db.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

> The tree shows the key files; other components and utilities are omitted for brevity.

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** 18.18+ (20+ recommended)
- **npm**
- An **Appwrite** project (Cloud or self-hosted)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Nishit-soni-01/riverflow-qna-platform.git
cd riverflow-qna-platform

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local   # or create .env.local manually

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Public (safe for the browser)
NEXT_PUBLIC_APPWRITE_HOST_URL=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Secret (server-side ONLY — never prefix with NEXT_PUBLIC_)
APPWRITE_API_KEY=your_secret_api_key
```

> ⚠️ The Appwrite **API key must stay server-side** and must never be exposed to client components or public environment variables. Never commit `.env` files (`.env*` is already in `.gitignore`).

---

## 🔐 Authentication Setup (OAuth)

### Google

1. Create an OAuth client in **Google Cloud Console**.
2. Add your site as an authorized JavaScript origin.
3. Register the **Appwrite callback URL** as an authorized redirect URI.
4. Enter the Client ID and Client Secret in **Appwrite → Auth → Settings → Google**.

### GitHub

1. Create an OAuth App in **GitHub → Settings → Developer settings**.
2. Set the homepage URL to your production site.
3. Register the **Appwrite callback URL** as the authorization callback.
4. Enter the Client ID and Client Secret in **Appwrite → Auth → Settings → GitHub**.

> 💡 The callback hostname must **exactly match** the one in the authorization request (e.g. `cloud.appwrite.io` vs. `fra.cloud.appwrite.io`), otherwise the provider will reject the redirect.

---

## ☁️ Deployment

The app is deployed on **Vercel** with automatic deployments from the `main` branch.

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add the environment variables in **Project Settings → Environment Variables**.
4. Deploy and wait for the status to show **Ready**.
5. Add your production URL to the Appwrite platform list and OAuth provider settings.

Before pushing, verify the build locally:

```bash
npm run build
```

---

## 🛡 Security

- Appwrite API key and OAuth secrets are kept server-side and out of the repository
- Session-based authentication via Appwrite
- HTTPS in production
- Server-side verification for protected operations
- Rotate any secret that has ever been exposed, and update it in Appwrite

---

## 🧩 Challenges & Solutions

| Challenge | Solution |
|---|---|
| `/tags` route returned 404 | Added `src/app/(main)/tags/page.tsx` and resolved the Next.js 16 prerendering issue |
| Google OAuth redirect mismatch | Registered the exact Appwrite callback URI in Google Cloud Console |
| GitHub OAuth redirect mismatch | Matched the callback hostname to the actual authorization request |
| OAuth buttons not working on Android | Committed and deployed the updated authentication files to Vercel |

---

## 🗺 Roadmap

- [ ] Full-text search across questions
- [ ] Advanced filtering, sorting and pagination
- [ ] Rich-text / Markdown editor with code highlighting
- [ ] Complete reputation & badge system
- [ ] Real-time notifications
- [ ] Migrate `middleware` convention to `proxy` (Next.js 16)
- [ ] Automated tests and CI pipeline

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**Nishit Soni**

- GitHub: [@Nishit-soni-01](https://github.com/Nishit-soni-01)
- Project: [riverflow-qna-platform](https://github.com/Nishit-soni-01/riverflow-qna-platform)
- Live: [riverflow-qna-platform.vercel.app](https://riverflow-qna-platform.vercel.app)

<div align="center">

⭐ If you found this project useful, please give it a star on GitHub!

</div>
