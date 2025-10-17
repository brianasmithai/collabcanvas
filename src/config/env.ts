// Environment loader and configuration for Vite + TypeScript apps
// Provides typed access to Firebase-related env vars and app mode flags.

export type AppMode = 'development' | 'test' | 'production';

export type AppEnv = {
	mode: AppMode;
	firebase: {
		apiKey: string;
		authDomain: string;
		projectId: string;
		storageBucket: string;
		messagingSenderId: string;
		appId: string;
		databaseURL: string;
		measurementId?: string;
	};
};

type RawEnv = Record<string, unknown>;

const rawImportMetaEnv: RawEnv =
	typeof import.meta !== 'undefined' && (import.meta as any).env
		? ((import.meta as any).env as RawEnv)
		: {};

const rawProcessEnv: Record<string, string | undefined> =
	typeof process !== 'undefined' && process.env ? process.env : {};

function readEnvVar(
	key: string,
	options?: { optional?: boolean; defaultValue?: string }
): string | undefined {
	const candidate = (rawImportMetaEnv as any)[key] ?? rawProcessEnv[key];
	if (candidate == null || candidate === '') {
		return options?.optional ? options.defaultValue : undefined;
	}
	return String(candidate);
}

function requireEnvVar(key: string): string {
	const value = readEnvVar(key);
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function resolveMode(): AppMode {
	const viteMode = (rawImportMetaEnv as any).MODE as string | undefined;
	const nodeEnv = rawProcessEnv.NODE_ENV;
	const mode = (viteMode ?? nodeEnv ?? 'development').toLowerCase();
	if (mode === 'production') return 'production';
	if (mode === 'test') return 'test';
	return 'development';
}

export function resolveEnv(): AppEnv {
	const measurementId = readEnvVar('VITE_FIREBASE_MEASUREMENT_ID', {
		optional: true,
	});

	const firebase = {
		apiKey: requireEnvVar('VITE_FIREBASE_API_KEY'),
		authDomain: requireEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
		projectId: requireEnvVar('VITE_FIREBASE_PROJECT_ID'),
		storageBucket: requireEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
		messagingSenderId: requireEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
		appId: requireEnvVar('VITE_FIREBASE_APP_ID'),
		databaseURL: requireEnvVar('VITE_FIREBASE_DATABASE_URL'),
		...(measurementId ? { measurementId } : {}),
	};

	const finalEnv: AppEnv = {
		mode: resolveMode(),
		firebase,
	};

	return Object.freeze(finalEnv) as AppEnv;
}

export const env: AppEnv = resolveEnv();

export const isProduction = env.mode === 'production';
export const isDevelopment = env.mode === 'development';
export const isTest = env.mode === 'test';


