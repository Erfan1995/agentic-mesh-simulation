# Agentic Mesh Simulation

A small React + TypeScript demo that visualizes an "Agentic Mesh" and demonstrates dynamic orchestration using the Gemini API.

This workspace contains a Vite app with TailwindCSS. The main UI component is `src/App.tsx` (the component you provided), wired to read the Gemini API key from a Vite environment variable.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Provide your Gemini API key (optional, the app has a fallback demo when no key is provided):

Create a `.env.local` file in the project root with:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

3. Run the dev server:

```bash
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

Notes

- If no API key is present, the app will use a safe fallback plan so the demo remains functional.
- The app uses `lucide-react` for icons and Tailwind for styling.

If you want, I can install the dependencies in this devcontainer for you and start the dev server. Would you like me to do that now?
# agentic-mesh-simulation