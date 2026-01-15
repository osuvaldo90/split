# Split

Real-time collaborative bill splitting for groups.

> Built using [Claude Code](https://claude.ai/claude-code) + [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done) — a planning system that turns Claude into a solo dev powerhouse.

## Features

- **Receipt OCR** - Snap a photo, AI extracts line items automatically
- **Real-time sync** - Changes appear instantly for all participants
- **Shareable codes** - 6-character codes to join any bill
- **Collaborative claiming** - Multiple people can split the same item
- **Smart calculations** - Tax and tip distributed proportionally

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** TailwindCSS v4
- **Backend:** Convex (real-time database)
- **AI:** Claude API (receipt parsing)

## Quick Start

```bash
# Install dependencies
npm install

# Start Convex backend (first time will prompt for project setup)
npx convex dev

# In another terminal, start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

**Getting an API key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to API Keys and create a new key
4. Copy the key to your `.env.local` file

The API key is required for receipt OCR functionality.

## Project Structure

```
src/
  components/    # React components
  pages/         # Route pages (Home, Bill)
  lib/           # Utilities and helpers

convex/
  schema.ts      # Data model
  *.ts           # Backend functions (queries, mutations, actions)

docs/
  architecture.md  # Key patterns and design decisions
```

## Documentation

- [Architecture Overview](docs/architecture.md) - Key patterns, data model, and design decisions

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
