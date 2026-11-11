import fs from 'node:fs';
import path from 'node:path';

function readDotenv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

const envFile = path.join(process.cwd(), '.env');
const values = { ...readDotenv(envFile), ...process.env };
const configured = (key: string) => Boolean(values[key]?.trim());
const httpsUrl = (key: string) => values[key]?.startsWith('https://') ?? false;
const hostedCheckout =
  configured('PAYMENT_LINK_ONEOFF') &&
  configured('CHECKOUT_URL_PRO') &&
  configured('CHECKOUT_URL_CREATOR');
const apiCheckout =
  configured('CREEM_API_KEY') &&
  configured('CREEM_PRODUCT_ONEOFF') &&
  configured('CREEM_PRODUCT_PRO') &&
  configured('CREEM_PRODUCT_CREATOR');

const checks: Array<[string, boolean, string]> = [
  ['Local .env', fs.existsSync(envFile), 'created by pnpm setup:local'],
  [
    'Auth secret',
    (values.BETTER_AUTH_SECRET?.length ?? 0) >= 32 &&
      values.BETTER_AUTH_SECRET !== 'dev-insecure-change-me',
    'BETTER_AUTH_SECRET must be random and at least 32 characters',
  ],
  ['Database URL', configured('DATABASE_URL'), 'DATABASE_URL is required'],
  [
    'Resend email',
    configured('RESEND_API_KEY') &&
      configured('EMAIL_FROM') &&
      !values.EMAIL_FROM!.includes('@resend.dev'),
    'verify a sending domain, then set RESEND_API_KEY and EMAIL_FROM',
  ],
  ['Creem webhook', configured('CREEM_WEBHOOK_SECRET'), 'required before production payments'],
  [
    'Creem checkout',
    hostedCheckout || apiCheckout,
    'set hosted links or API key plus all three product IDs',
  ],
  [
    'Public app URL',
    httpsUrl('APP_URL') && httpsUrl('BETTER_AUTH_URL'),
    'use final HTTPS URLs in production',
  ],
];

console.log('\noverseas-saas-starter configuration\n');
for (const [name, ok, hint] of checks) {
  console.log(`${ok ? '✓' : '○'} ${name}: ${ok ? 'configured' : 'not ready'} — ${hint}`);
}

const strict = process.argv.includes('--strict');
const blocking = checks.filter(
  ([name, ok]) =>
    !ok &&
    ['Auth secret', 'Database URL', 'Resend email', 'Creem webhook', 'Creem checkout', 'Public app URL'].includes(
      name,
    ),
);
if (strict && blocking.length > 0) process.exitCode = 1;
