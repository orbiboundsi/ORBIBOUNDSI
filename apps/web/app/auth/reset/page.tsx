import { AuthShell } from '../../../components/auth-shell';
import { ResetRequestForm } from '../../../components/reset-request-form';

export default function ResetPage(): React.ReactElement {
  return <AuthShell eyebrow="Account recovery" title="Reset your password" description="We will send a secure recovery link to your account email."><ResetRequestForm /></AuthShell>;
}
