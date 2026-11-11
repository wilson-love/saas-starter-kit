import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(envPath)) {
  const secret = crypto.randomBytes(32).toString('base64url');
  const template = fs.readFileSync(examplePath, 'utf8');
  const contents = template.replace(
    'BETTER_AUTH_SECRET=dev-insecure-change-me',
    `BETTER_AUTH_SECRET=${secret}`,
  );
  fs.writeFileSync(envPath, contents, { mode: 0o600 });
  console.log('Created .env with a fresh local BETTER_AUTH_SECRET.');
} else {
  console.log('.env already exists; leaving it unchanged.');
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
execFileSync(pnpm, ['db:migrate'], { cwd: root, stdio: 'inherit' });
console.log('Local setup complete. Run `pnpm check:config` and `pnpm dev`.');
