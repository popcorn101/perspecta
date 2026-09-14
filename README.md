# PERSPECTA — PRISM Media Framing Platform

PERSPECTA is a web platform designed to deconstruct news coverage into inspectable framing signals using the PRISM methodology. It allows users to analyze and compare multiple news perspectives side-by-side without relying on subjective bias meters.

---

## 🚀 Features

- **PRISM Methodology Integration:** Structural rhetorical analysis across key framing dimensions.
- **Side-by-Side Comparison:** Compare coverage across multiple media sources interactively.
- **Inspectable Framing Signals:** Highlighted rhetorical patterns, word choice, and structural choices.
- **Interactive Demos & Mock Engine:** Built-in demo datasets for instant testing and evaluation.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **Validation & Utilities:** Zod, clsx, tailwind-merge

---

## 🏃 Getting Started

### Prerequisites

Make sure you have Node.js (v18+ recommended) and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd perspecta
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` (if applicable) and fill in necessary configuration.
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Available Scripts

- `npm run dev` — Starts the Next.js development server.
- `npm run build` — Builds the application for production deployment.
- `npm start` — Starts the production server.
- `npm run lint` — Runs ESLint checks across the project codebase.
