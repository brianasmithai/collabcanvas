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
5. Configure Security Rules (see Security Rules section below)
6. Create a `.env.local` file with your Firebase config:

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

## Security Rules

### Firestore Rules

Copy and paste these rules into your Firestore Database Rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rectangles collection - auth required, basic validation
    match /rectangles/{rectangleId} {
      allow read, write: if request.auth != null;
      
      // Validate write operations
      allow write: if request.auth != null 
        && request.resource.data.keys().hasAll(['id', 'x', 'y', 'width', 'height', 'rotation', 'updatedAt', 'updatedBy'])
        && request.resource.data.updatedBy == request.auth.uid;
    }
  }
}
```

### Realtime Database Rules

Copy and paste these rules into your Realtime Database Rules in the Firebase Console:

```json
{
  "rules": {
    "presence": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

### Rule Explanations

**Firestore Rules:**
- ✅ **Authentication required**: Only authenticated users can read/write rectangles
- ✅ **Field validation on writes**: Ensures all required fields are present when creating/updating rectangles
- ✅ **User ownership**: `updatedBy` field must match the authenticated user's UID
- ✅ **Read access**: All authenticated users can read rectangles (for collaboration)

**Realtime Database Rules:**
- ✅ **Authentication required**: Only authenticated users can access presence data
- ✅ **User isolation**: Users can only write to their own presence node (`/presence/{uid}`)
- ✅ **Read access**: All authenticated users can read all presence data (for collaboration)
- ✅ **Write access**: All authenticated users can write to presence (for cursor updates)

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

## Deployment to Vercel

### Prerequisites for Deployment

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Firebase Project**: Already configured (see Firebase Setup above)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create `.env.local` file** in your project root with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended for first-time setup)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**:
   - Select your GitHub account
   - Find and select your `collabcanvas` repository
   - Click "Import"

4. **Configure the project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

5. **Add Environment Variables**:
   - Click "Environment Variables" section
   - Add each Firebase environment variable:
     - `VITE_FIREBASE_API_KEY` = `your_api_key`
     - `VITE_FIREBASE_AUTH_DOMAIN` = `your_project.firebaseapp.com`
     - `VITE_FIREBASE_PROJECT_ID` = `your_project_id`
     - `VITE_FIREBASE_STORAGE_BUCKET` = `your_project.appspot.com`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID` = `your_sender_id`
     - `VITE_FIREBASE_APP_ID` = `your_app_id`
     - `VITE_FIREBASE_DATABASE_URL` = `https://your_project-default-rtdb.firebaseio.com`

6. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be available at `https://your-project-name.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Set up environment variables when prompted

### Step 3: Verify Deployment

After deployment, test your application:

1. **Open your Vercel URL** in a browser
2. **Test authentication**:
   - Create a new account
   - Sign in with existing account
3. **Test collaboration**:
   - Open the app in two different browsers
   - Create rectangles in one browser
   - Verify they appear in the other browser
4. **Test persistence**:
   - Create some rectangles
   - Refresh the page
   - Verify rectangles persist

### Step 4: Configure Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `myproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `myproject-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `myproject.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | `https://myproject-default-rtdb.firebaseio.com` |

### Troubleshooting

**Build Fails:**
- Check that all environment variables are set correctly
- Verify your Firebase configuration is valid
- Check the build logs in Vercel dashboard

**App Doesn't Load:**
- Verify Firebase project is properly configured
- Check browser console for errors
- Ensure all Firebase services are enabled

**Authentication Issues:**
- Verify Firebase Auth is enabled
- Check that email/password authentication is enabled
- Verify auth domain is configured correctly

**Real-time Features Not Working:**
- Check that Firestore and Realtime Database are enabled
- Verify security rules are properly configured
- Check browser console for Firebase errors

## Project Status

✅ **MVP Complete** - Core features implemented and deployed. See the [tasks documentation](docs/tasks.md) for completed features.

## License

MIT