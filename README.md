# CollabCanvas

A real-time collaborative canvas application built with React, TypeScript, Vite, and Firebase.

## Features

- Real-time collaborative drawing and editing
- User authentication and presence tracking
- Canvas with shapes, text, and drawing tools
- Multi-user cursor tracking and live updates

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Canvas**: Konva.js + react-konva
- **State Management**: Zustand
- **Backend**: Firebase (Auth + Firestore + Realtime Database)
- **Hosting**: Vercel
- **AI Integration**: Vercel AI SDK

## Environment Variables

This application requires several Firebase configuration environment variables. Create a `.env.local` file in the project root with the following variables:

### Required Firebase Configuration

```bash
# Firebase Project Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/

# Optional Firebase Configuration
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id  # Optional: for Google Analytics
```

### Getting Firebase Configuration Values

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or create a new one
6. Copy the configuration values from the `firebaseConfig` object

### Environment Variable Notes

- All environment variables must be prefixed with `VITE_` to be accessible in the browser
- The `VITE_FIREBASE_MEASUREMENT_ID` is optional and only needed if you want Google Analytics
- Never commit your `.env.local` file to version control
- The application will throw clear error messages if required environment variables are missing

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collabcanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create `.env.local` file with Firebase configuration (see above)
   - Ensure all required variables are set

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test --run
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
├── config/             # Configuration files (env.ts)
├── lib/                # Library code and utilities
│   └── firebase/       # Firebase client initialization
├── services/           # Business logic services
├── state/              # State management (Zustand stores)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Firebase Setup

The application uses Firebase for:
- **Authentication**: User sign-in/sign-up
- **Firestore**: User documents and canvas data
- **Realtime Database**: Live presence and cursor tracking

Make sure your Firebase project has the following services enabled:
- Authentication (Email/Password provider)
- Firestore Database
- Realtime Database

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test --run` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
