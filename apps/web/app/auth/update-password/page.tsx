import { AuthShell } from '../../../components/auth-shell';
import { UpdatePasswordForm } from '../../../components/update-password-form';

export default function UpdatePasswordPage(): React.ReactElement {
  return <AuthShell eyebrow="Recovery session" title="Choose a new password" description="Set a fresh password before returning to your operations workspace."><UpdatePasswordForm /></AuthShell>;
}
