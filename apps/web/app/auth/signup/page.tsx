import { AuthForm } from '../../../components/auth-form';
import { AuthShell } from '../../../components/auth-shell';

interface SignupPageProps { searchParams: { next?: string } }

export default function SignupPage({ searchParams }: SignupPageProps): React.ReactElement {
  return <AuthShell eyebrow="Create workspace access" title="Start monitoring with OrbiBound" description="Create a secure account for your satellite intelligence workspace."><AuthForm mode="signup" nextPath={searchParams.next} /></AuthShell>;
}
