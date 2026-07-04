# CampusOS

CampusOS is a modern, unified campus management system featuring dynamic dashboards, real-time messaging, academic tracking, hostel management, and a student marketplace. It is built using React, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion
- **State Management**: Redux Toolkit, React Query
- **Backend/Database**: Supabase (PostgreSQL)

## Project Structure
- `/client` - The Vite React frontend application.
- `/server` - The Supabase SQL migrations.

## Getting Started Locally

### 1. Database Setup
You will need a Supabase project. 
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Navigate to the SQL Editor in your Supabase dashboard.
3. You must execute the SQL migration files located in the `server/migrations` directory **in sequential order** (`00000_initial_schema.sql` through `00006_chat.sql`). See the [Server README](./server/README.md) for more details.

### 2. Frontend Setup
Navigate into the `client` directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

### 3. Environment Variables
In the `client` directory, copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:
- `VITE_SUPABASE_URL`: Found in your Supabase Project Settings -> API.
- `VITE_SUPABASE_ANON_KEY`: Found in your Supabase Project Settings -> API.

### 4. Run the App
Start the development server:
```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

## Deployment
This project is configured to be deployed easily to **Vercel**. 
1. Connect your GitHub repository to Vercel.
2. Set the Root Directory to `client`.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Vercel Environment Variables.
4. The included `vercel.json` will ensure React Router handles all routes correctly without throwing 404 errors on refresh.
