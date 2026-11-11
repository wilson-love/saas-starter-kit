import Link from 'next/link';
import SignInForm from '@/components/SignInForm';

export const metadata = { title: 'Sign in — Your SaaS' };

// magic-link 验证失败时 better-auth 会回跳到 errorCallbackURL 并带上 error 参数
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    'This sign-in link is invalid, expired (links expire in 15 minutes), or was already used. Request a fresh link below.',
  failed_to_create_session: 'Could not start your session. Please request a new sign-in link.',
  user_not_found: 'Your account could not be found. Please request a new sign-in link.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialError = error
    ? (ERROR_MESSAGES[error] ?? 'Sign-in failed. Please request a new link.')
    : '';

  return (
    <div className="px-4 pb-16">
      <SignInForm initialError={initialError} />
      <p className="mx-auto mt-4 max-w-md text-center text-xs text-slate-500">
        <Link href="/pricing" className="font-semibold text-brand-700 hover:underline">
          See plans without signing in
        </Link>
      </p>
    </div>
  );
}
