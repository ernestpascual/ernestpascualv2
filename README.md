# Ernest Pascual | Personal Website

A highly interactive, visually striking personal website built to resemble a mystical tarot/oracle card spread reading experience. Designed for seamless exploration, the site utilizes a custom drag-and-drop board powered by Next.js and React.

## Features

- **Interactive Tarot Board**: An expansive 1.5x scale canvas (150vw x 150vh) that allows users to seamlessly pan around by dragging the board.
- **Drag & Drop Cards**: A custom pointer-event-driven physics engine allows visitors to pick up and drop tarot cards onto designated spread positions.
- **Iridescent Holographic Sweeps**: Cards placed in spreads sequence a beautiful iridescent foil and glittering sweep animation before the reading begins.
- **Halftone Dust Particles**: A dense mesh of 2,500 floating particles running on `@tsparticles/react` that act like space dust and react to your mouse movements.
- **Custom Cursor**: A custom-built, fine glowing red point replaces the default system cursor, seamlessly moving through the digital ether.
- **AI Tarot Readings (Gemini)**: Seamlessly integrates with Google's Gemini AI to dynamically interpret the live state of your dragged cards against their spread slots.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/)
- **AI**: [Google Generative AI SDK](https://ai.google.dev/) (`gemini-2.5-flash`)
- **Styling**: Vanilla CSS with Tailwind CSS configurations
- **Data**: Centralized via `app/config/data.json` for easy content and AI persona updates

## Getting Started

First, install the dependencies:

```bash
npm install
```

Next, configure your environment variables by copying the example file:

```bash
cp .env.example .env
```
Add your Google Gemini API key to the new `.env` file: `GEMINI_API_KEY=your_key_here`

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the experience.

## Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a GitHub repository.
2. Import the repository into your Vercel dashboard.
3. Before deploying, go to the project's **Settings** > **Environment Variables** in Vercel.
4. Add a new variable with the key `GEMINI_API_KEY` and your actual API key as the value.
5. Click **Deploy** (or **Redeploy** if you added the key after the initial build).

## Configuration Guide (`app/config/data.json`)

The entire application is driven by a single, central JSON file located at `app/config/data.json`. This file acts as your control panel, allowing you to tweak the AI persona, toggle UI features, and manage content without touching the React code.

### 1. Global Settings
- **`systemPrompt`**: Defines the persona for the Gemini AI. Edit this to change how the oracle "speaks" and interprets the cards.
- **`sendToGemini`**: (`true` | `false`) A master switch for the AI. Set to `false` to test the UI animations (like the holo sweep) without actually making network requests or consuming API credits.
- **`title` & `introText`**: Controls the typography and welcome text on the top left of the screen.

### 2. Card Management
Inside the `cards` array, each object represents a physical card on the board:
- **`image`**: The file path to your custom card art (e.g., `/img/cards/1.jpg`).
- **`meaning`**: The core definition of the card that gets passed to the AI engine for the reading.
- **`isVisible`**: (`true` | `false`) Easily hide a card from the UI without having to delete its data object.
- **`isOuterGlowCard`**: (`true` | `false`) If set to `true`, the card will emit an intense, pulsing neon box-shadow when the holographic sweep animation triggers.

### 3. Spread Slots
Inside the `spreads` array, each object defines a droppable slot on the board:
- **`label`**: The visible text label under the slot.
- **`meaning`**: The contextual significance of this slot, passed directly to the AI to combine with the card's meaning.
