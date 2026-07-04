# CampusOS Database Schema (Supabase)

This directory contains the SQL files necessary to set up the complete CampusOS database on Supabase.

## Execution Order
It is **CRITICAL** that you execute these SQL files in the exact order specified below. Tables and functions depend on ones created in previous steps.

1. **`00000_initial_schema.sql`**: Sets up base tables (`colleges`, `departments`, `profiles`), roles, triggers, and Row Level Security (RLS) helpers.
2. **`00001_directory.sql`**: Sets up extended profile tables (`students`, `faculty`, `staff`).
3. **`00002_hostel.sql`**: Sets up the hostel management system (`hostels`, `rooms`, `hostel_wardens`).
4. **`00003_marketplace.sql`**: Sets up the student marketplace (`marketplace_items`).
5. **`00004_emergency.sql`**: Sets up the SOS and emergency alert system (`emergency_alerts`).
6. **`00005_academic.sql`**: Sets up the core academic engine (`courses`, `course_enrollments`, `attendance`, `grades`).
7. **`00006_chat.sql`**: Sets up the real-time messaging system (`chat_channels`, `chat_participants`, `chat_messages`).

## How to execute
1. Open your Supabase project dashboard.
2. Click on the **SQL Editor** on the left sidebar.
3. Open the file `00000_initial_schema.sql` in a text editor, copy all of its contents, paste it into the Supabase SQL Editor, and click "Run".
4. Repeat step 3 for the remaining files in sequential order.
