import { useEffect, useState, type FormEvent } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import type { AuthUser } from '../auth/types';
import { profileService } from './profileService';

type ProfilePageProps = {
  fallbackUser: AuthUser;
  onPasswordChanged: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'AUTH_CURRENT_PASSWORD_INVALID') return 'The current password is incorrect.';
    if (error.code === 'AUTH_PASSWORD_SAME') return 'The new password must be different from the current password.';
    if (error.code === 'AUTH_PASSWORD_REUSED') return 'The new password cannot match any of your last five passwords.';
    if (error.status === 400) return Object.values(error.validationErrors ?? {})[0] || error.message;
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function ProfilePage({ fallbackUser, onPasswordChanged }: ProfilePageProps) {
  useDocumentTitle('My Profile | BNI');
  const [user, setUser] = useState<AuthUser>(fallbackUser);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    void profileService.getCurrentUser(controller.signal)
      .then((response) => { setUser(response); setProfileError(''); })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setProfileError(getErrorMessage(error));
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, []);

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) { setPasswordError('New password and confirmation do not match.'); return; }
    if (newPassword.length < 8 || newPassword.length > 72) { setPasswordError('New password must be between 8 and 72 characters.'); return; }
    if (currentPassword === newPassword) { setPasswordError('The new password must be different from the current password.'); return; }
    setIsSaving(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      onPasswordChanged();
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally { setIsSaving(false); }
  };

  return <div className="crud-page profile-page">
    <header className="page-header"><p>Account</p><h1>My Profile</h1></header>
    <div className="profile-layout">
      <section className="management-card profile-card" aria-labelledby="profile-details-title">
        <div className="section-heading"><h2 id="profile-details-title">Profile Details</h2>{isLoading && <span>Refreshing...</span>}</div>
        {profileError && <p className="inline-error" role="alert">{profileError} Showing information from your current session.</p>}
        <dl className="profile-details">
          <div><dt>Username</dt><dd>{user.username}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div className="profile-details__wide"><dt>Groups</dt><dd>{user.groups.length ? <span className="tag-list">{user.groups.map((group) => <span className="tag" key={group.id}>{group.groupName}</span>)}</span> : 'No groups assigned'}</dd></div>
        </dl>
      </section>
      <section className="management-card profile-card" aria-labelledby="change-password-title">
        <div className="section-heading"><h2 id="change-password-title">Change Password</h2></div>
        <p className="profile-password-help">Use 8-72 characters. You cannot reuse any of your last five passwords.</p>
        <form className="profile-password-form" onSubmit={(event) => void changePassword(event)}>
          <div className="form-field"><label htmlFor="profile-current-password">Current password</label><input id="profile-current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} maxLength={72} required autoComplete="current-password" disabled={isSaving} /></div>
          <div className="form-field"><label htmlFor="profile-new-password">New password</label><input id="profile-new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" disabled={isSaving} /></div>
          <div className="form-field"><label htmlFor="profile-confirm-password">Confirm new password</label><input id="profile-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" disabled={isSaving} /></div>
          {passwordError && <p className="inline-error" role="alert">{passwordError}</p>}
          <div className="profile-password-actions"><button className="button button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Changing Password...' : 'Change Password'}</button></div>
        </form>
      </section>
    </div>
  </div>;
}
