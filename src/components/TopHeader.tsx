type TopHeaderProps = {
  username: string;
  isLoggingOut: boolean;
  onProfile: () => void;
  onLogout: () => void;
};

export function TopHeader({ username, isLoggingOut, onProfile, onLogout }: TopHeaderProps) {
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="top-header">
      <span>{currentDate}</span>
      <nav className="top-header__actions" aria-label="Quick actions">
        <a href="#profile" aria-label={`Profile: ${username}`} title={username} onClick={(event) => { event.preventDefault(); onProfile(); }}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" />
          </svg>
        </a>
        <a href="#" aria-label="Messages" title="Messages" onClick={(event) => event.preventDefault()}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 5.5h16v11H8l-4 3v-14Z" />
            <path d="M8 10h8M8 13h5" />
          </svg>
        </a>
        <button className="top-header__action" type="button" aria-label="Logout" title="Logout" onClick={onLogout} disabled={isLoggingOut}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M14 4H5v16h9M11 12h9m-3-3 3 3-3 3" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
