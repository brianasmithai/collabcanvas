# CollabCanvas

A real-time collaborative canvas application built with React, TypeScript, and Firebase.

## Features

- **Real-time collaboration**: Multiple users can work on the same canvas simultaneously
- **Live cursors**: See other users' cursors and selections in real-time
- **Rectangle shapes**: Create, move, resize, and rotate rectangles
- **Persistent canvas**: Your work is automatically saved and restored
- **Authentication**: Secure user accounts with Firebase Auth

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Canvas**: Konva + react-konva
- **State Management**: Zustand
- **Backend**: Firebase (Auth + Firestore + Realtime Database)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (for backend services)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see Firebase Setup below)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Enable Realtime Database
5. Create a `.env.local` file with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

**Note:** The `.env.local` file is already configured for this project with the Firebase configuration. The Firebase client is initialized in `src/config/firebaseClient.ts` and exports `auth`, `firestore`, and `rtdb` services.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Status

🚧 **Currently in MVP development** - This is a work in progress. See the [tasks documentation](docs/tasks.md) for current progress and roadmap.

## License

MIT