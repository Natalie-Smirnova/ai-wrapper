# AI Chat

DEMO VIDEO: https://drive.google.com/drive/folders/1wmrnngfLYm8iMJ8CHA2WQ84ZqEzY6Y87?usp=sharing
VERCEL: https://ai-wrapper-ten.vercel.app/chat

A ChatGPT-like chatbot interface with multi-LLM support, real-time streaming, file uploads, and cross-tab synchronization.

## Features

- **Multi-LLM support** — OpenAI (GPT-4o, GPT-4o Mini) and Google Gemini (1.5 Pro, 1.5 Flash) with in-chat model switching
- **Real-time streaming** — Token-by-token SSE streaming from LLM to client
- **Authentication** — Email/password auth via Supabase Auth
- **Anonymous access** — 3 free questions without signing up, chats migrate on registration
- **Chat management** — Create, rename, delete chats with persistent sidebar
- **Image attachments** — Paste from clipboard or upload files; images sent to LLM as visual context
- **Document upload** — PDF, DOCX, TXT, Markdown extraction and chunking for contextual Q&A
- **Cross-tab sync** — Chat list updates in real-time across browser tabs via Supabase Realtime
- **Auto-title** — Chat titles generated automatically after the first exchange
- **Responsive UI** — Desktop sidebar + mobile drawer, built with shadcn/ui

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Next.js 16 (App Router), React 19, TanStack Query |
| UI | shadcn/ui, Tailwind CSS 4 |
| API | Next.js Route Handlers (REST) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (Postgres Changes) |
| LLM | OpenAI SDK, Google Generative AI SDK |
| File parsing | pdf-parse, mammoth |

## Project Structure

```
src/
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Auth pages (login, signup)
│   ├── (main)/                     # Main app shell with sidebar
│   │   └── chat/                   # Chat pages (new chat, [chatId])
│   └── api/                        # REST API routes
│       ├── auth/                   #   GET /me, POST /register, POST /claim
│       ├── chats/                  #   CRUD + messages + attachments
│       ├── attachments/            #   GET signed URL
│       └── models/                 #   GET available models
├── lib/
│   ├── api/                        # Client-side fetch wrappers
│   ├── db/                         # Server-side DB queries (Supabase service-role)
│   ├── llm/                        # LLM provider abstraction (OpenAI, Gemini)
│   ├── auth/                       # Auth middleware + browser Supabase client
│   ├── storage/                    # Supabase Storage helpers (upload, signed URL)
│   ├── documents/                  # Document text extraction + chunking
│   └── realtime/                   # Supabase Realtime client (browser)
├── hooks/                          # React hooks (TanStack Query)
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── chat/                       # Chat UI (messages, input, streaming, model selector)
│   ├── sidebar/                    # Sidebar (chat list, new chat button)
│   ├── auth/                       # Login/signup forms
│   ├── layout/                     # Anonymous banner
│   └── providers/                  # QueryClient + Auth context providers
├── types/                          # Shared TypeScript types
└── supabase/
    └── schema.sql                  # Database schema
```

### Architecture

The codebase enforces strict layer separation:

```
Components/Hooks → lib/api/ (fetch) → API Routes → lib/db/ (Supabase service-role)
```

- **No DB calls in components** — all data flows through REST API routes
- **Service-role only** — the Supabase public client is used exclusively for Auth and Realtime
- **No RLS** — access control is handled in API route middleware

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com/) project (free tier works)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Google Gemini API key](https://aistudio.google.com/apikey) (optional, for Gemini models)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-wrapper
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Note your **Project URL**, **anon key**, and **service role key** from Settings > API

### 3. Set up the database

1. In the Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this repo
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run**

This creates 6 tables (`users`, `anonymous_sessions`, `chats`, `messages`, `attachments`, `document_chunks`), indexes, a helper function, and enables Realtime on the `chats` table.

### 4. Create storage bucket

1. In the Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name it `attachments`
4. Set it to **Private** (not public)

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase (from Settings > API in your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Providers
OPENAI_API_KEY=your-openai-api-key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/me` | Current user or anonymous session info |
| `POST` | `/api/auth/register` | Create user profile after signup |
| `POST` | `/api/auth/claim` | Migrate anonymous chats to authenticated user |
| `GET` | `/api/chats` | List chats (paginated) |
| `POST` | `/api/chats` | Create a new chat |
| `GET` | `/api/chats/:chatId` | Get a single chat |
| `PATCH` | `/api/chats/:chatId` | Update chat (title, model) |
| `DELETE` | `/api/chats/:chatId` | Delete a chat |
| `GET` | `/api/chats/:chatId/messages` | List messages (paginated) |
| `POST` | `/api/chats/:chatId/messages` | Send message + stream LLM response (SSE) |
| `POST` | `/api/chats/:chatId/attachments` | Upload image or document |
| `DELETE` | `/api/chats/:chatId/attachments/:id` | Delete an attachment |
| `GET` | `/api/attachments/:id/url` | Get signed download URL |
| `GET` | `/api/models` | List available LLM providers and models |

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | App user profiles (mirrors Supabase Auth) |
| `anonymous_sessions` | Tracks anonymous users and their question count |
| `chats` | Conversations, linked to either a user or anonymous session |
| `messages` | Chat messages (user, assistant, system roles) |
| `attachments` | Uploaded files metadata (images and documents) |
| `document_chunks` | Extracted text chunks from uploaded documents |

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com/)
3. Add all environment variables from `.env.example` in the Vercel project settings
4. Deploy
