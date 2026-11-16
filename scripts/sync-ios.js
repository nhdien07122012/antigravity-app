import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Step 1: Building Web Application (Vite -> dist/) ---');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('--- Step 2: Bumping Build Version ---');
execSync('node scripts/bump-build.js', { cwd: rootDir, stdio: 'inherit' });

console.log('--- Step 3: Syncing to Native iOS (Capacitor) ---');
execSync('npx cap sync ios', { cwd: rootDir, stdio: 'inherit' });

console.log('--- Done: Platform Sync Completed Successfully! ---');
