# Ernest Pascual | Personal Website

A highly interactive, visually striking personal website built to resemble a mystical tarot/oracle card spread reading experience. Designed for seamless exploration, the site utilizes a custom drag-and-drop board powered by Next.js and React.

## Features

- **Interactive Tarot Board**: An expansive 1.5x scale canvas (150vw x 150vh) that allows users to seamlessly pan around by dragging the board.
- **Drag & Drop Cards**: A custom pointer-event-driven physics engine allows visitors to pick up and drop tarot cards onto designated spread positions.
- **Organic Felt Mat**: Features an organically edge-blended black velvet damask texture that perfectly tiles to mimic a real casino or reading mat.
- **Dynamic Collision System**: Spread slots automatically arrange themselves using a mathematical collision avoidance algorithm to ensure cards are always comfortably reachable.
- **Real-Time Location Tracking**: Automatically tracks and updates the UI based on exactly which spread position a card has been dropped into.
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

## Customization

All text, meanings, AI system instructions, and card imagery can be safely customized inside the `app/config/data.json` file.

- **Images**: Add new tarot images to `public/img/cards/`.
- **Favicon**: Change `public/favicon.svg` to update the tab icon.
- **Meanings**: Each slot and card has a `meaning` field that directly informs the AI reading.
- **AI Persona**: Edit the `systemPrompt` field to change how the AI interprets the cards.
