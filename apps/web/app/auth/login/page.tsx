import { AuthForm } from '../../../components/auth-form';
import { AuthShell } from '../../../components/auth-shell';

interface LoginPageProps { searchParams: { next?: string; error?: string } }

function errorMessage(code: string | undefined): string | undefined {
  if (code === 'missing_code') return 'The confirmation link was incomplete. Request a new link and try again.';
  if (code === 'invalid_or_expired_link') return 'This confirmation link is invalid or expired. Request a new link and try again.';
  return undefined;
}

export default function LoginPage({ searchParams }: LoginPageProps): React.ReactElement {
  return <AuthShell eyebrow="Identity checkpoint" title="Sign in to your workspace" description="Access monitored assets, explainable signals, and operational alerts."><AuthForm mode="login" nextPath={searchParams.next} initialError={errorMessage(searchParams.error)} /></AuthShell>;
}
