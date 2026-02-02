# Premier Adverts - Traffic System

A Next.js web application for managing advertising inventory across Audio, Display, and Email platforms.

## Features
- **Dashboard**: Real-time visibility of inventory levels (Podcasts, Radio, Web, Email).
- **Booking Engine**: "Wizard-style" form for Sales Execs to input campaigns.
- **Inventory Logic**: Automatic calculation of availability based on baselines and existing bookings.
- **Premium Design**: specialized dark mode with glassmorphism aesthetics.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS (Variables, CSS Modules)
- **State**: React Context (In-memory prototype)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure
- `src/app`: Pages and Global Styles
- `src/components`: Reusable UI components (Sidebar, Inventory Cards, Forms)
- `src/lib`: Core logic (Store, Constants)
- `src/types`: TypeScript definitions

## Status
- **Phase 1 & 2 Complete**: Core logic and UI foundation.
- **Prototype Mode**: Data is currently stored in session memory (refreshes on reload).
