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

## Conflict Resolution Policy

CollabCanvas uses a **Last-Write-Wins (LWW)** strategy for handling concurrent edits:

### How It Works

- **Timestamp-based**: Each rectangle update includes an `updatedAt` timestamp
- **User tracking**: Each update includes an `updatedBy` field with the user ID
- **Automatic resolution**: When conflicts occur, the update with the most recent timestamp wins
- **Optimistic UI**: Local changes appear immediately for smooth user experience

### Conflict Scenarios

1. **Simultaneous position changes**: The last position update wins
2. **Simultaneous resize operations**: The last size/rotation update wins
3. **Mixed operations**: Each property (x, y, width, height, rotation) is resolved independently

### Performance Optimizations

- **Throttled updates**: High-frequency operations (drag, resize) are throttled to 10 updates/second
- **Batch operations**: Multiple rectangle operations are batched for efficiency
- **Optimistic updates**: UI updates immediately while background sync occurs

### Example

```
User A moves rectangle at 10:00:00.000
User B moves same rectangle at 10:00:00.100
Result: User B's position wins (more recent timestamp)
```

## Manual Testing Guide

To verify the collaborative features work correctly, follow these steps:

### Setup
1. Open the app in two different browsers (e.g., Chrome and Firefox)
2. Create accounts with different email addresses (you can use `+` aliases like `user+1@example.com` and `user+2@example.com`)
3. Log in to both browsers

### Test Scenarios

#### 1. Basic Collaboration
- **Create rectangles**: Double-click in one browser to create rectangles
- **Verify sync**: Check that rectangles appear in the other browser
- **Move rectangles**: Drag rectangles in one browser, verify they move in the other
- **Resize/rotate**: Use the transformer handles to resize/rotate rectangles
- **Verify cursors**: Move your mouse in one browser, see the cursor in the other

#### 2. Persistence Testing
- **Create several rectangles** in different positions and sizes
- **Refresh both browser tabs** (F5 or Ctrl+R)
- **Verify persistence**: All rectangles should reappear in the same positions
- **Close and reopen** the browser tabs
- **Verify persistence**: Rectangles should still be there

#### 3. Conflict Resolution
- **Select the same rectangle** in both browsers
- **Move it simultaneously** in both browsers
- **Verify LWW**: The last move should win (most recent timestamp)
- **Try resizing** the same rectangle in both browsers
- **Verify resolution**: The last resize operation should win

#### 4. User Presence
- **Check user list**: Verify both users appear in the presence list
- **Move cursors**: Verify cursor positions update in real-time
- **Test selection**: Select rectangles and verify a subtle dashed circle appears around other users' cursors when they have selections

#### 5. Error Handling
- **Disconnect internet**: Temporarily disconnect one browser
- **Make changes**: Create/move rectangles in the connected browser
- **Reconnect**: Restore internet connection
- **Verify sync**: Changes should sync when connection is restored

### Expected Behavior
- ✅ Rectangles persist after refresh/close
- ✅ Real-time synchronization between users
- ✅ Cursor tracking works during all operations
- ✅ Conflict resolution follows LWW strategy
- ✅ Loading states show during initial load
- ✅ Empty state shows helpful message when no rectangles exist

## Project Status

🚧 **Currently in MVP development** - This is a work in progress. See the [tasks documentation](docs/tasks.md) for current progress and roadmap.

## License

MIT