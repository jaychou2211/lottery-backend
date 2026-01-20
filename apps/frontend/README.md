# Year-End Lottery Frontend

React frontend for the year-end lottery application, built with Vite.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Available Scripts

### `pnpm dev`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

Features hot module replacement (HMR) for instant updates.

### `pnpm build`

Builds the app for production to the `dist` folder.

### `pnpm preview`

Locally preview the production build.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_URL=http://localhost:3004/api
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t lottery-frontend -f docker/Dockerfile .

# Run container
docker run -p 8080:80 lottery-frontend
```

Or use the deploy script from the project root:

```bash
./deploy.sh --env=prod --service=nginx up -d --build
```

## Project Structure

```
src/
├── apis/          # API client functions
├── components/    # Reusable UI components
├── contexts/      # React context providers
├── pages/         # Page components
└── index.tsx      # App entry point
```
