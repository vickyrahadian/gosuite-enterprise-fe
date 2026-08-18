import { useState, type FormEvent } from 'react';
import bniLogo from '../../assets/bni-logo.svg';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { authService } from './authService';
import type { AuthSession } from './types';

type LoginPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  useDocumentTitle('Login | BNI');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUsername = username.trim();
    setError('');

    if (!normalizedUsername || !password) {
      setError('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      onAuthenticated(await authService.login({ username: normalizedUsername, password }));
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError
        ? requestError.message
        : 'Unable to connect to the authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <img src={bniLogo} alt="BNI" />
        </div>
        <div className="login-card__body">
          <p className="login-description">Enter your account credentials to continue.</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-username">Username</label>
              <input id="login-username" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={100} autoComplete="username" disabled={isSubmitting} autoFocus />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={72} autoComplete="current-password" disabled={isSubmitting} />
            </div>
            <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
      <footer className="login-footer">Copyright &copy; 2026 - BNI New York</footer>
    </main>
  );
}
