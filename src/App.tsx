import { useEffect, useState } from 'react';
import { authService } from './features/auth/authService';
import { clearAuthSession, getAuthSession, saveAuthSession } from './features/auth/authStorage';
import { LoginPage } from './features/auth/LoginPage';
import type { AuthSession } from './features/auth/types';
import { GroupManagementPage } from './features/groups/GroupManagementPage';
import { menuService } from './features/menus/menuService';
import type { Menu } from './features/menus/types';
import { MenuManagementPage } from './features/menus/MenuManagementPage';
import { MenuGroupManagementPage } from './features/menu-groups/MenuGroupManagementPage';
import { AuditLogsPage } from './features/audits/AuditLogsPage';
import { UserManagementPage } from './features/users/UserManagementPage';
import { MessageManagementPage } from './features/messages/MessageManagementPage';
import { CorrespondentManagementPage } from './features/correspondents/CorrespondentManagementPage';
import { AppParameterManagementPage } from './features/app-parameters/AppParameterManagementPage';
import { SftpConfigManagementPage } from './features/sftp-config/SftpConfigManagementPage';
import { SchedulerConfigManagementPage } from './features/scheduler-config/SchedulerConfigManagementPage';
import { SftpLogPage } from './features/sftp-log/SftpLogPage';
import { TransactionLogPage } from './features/transaction-log/TransactionLogPage';
import { SanctionListManagementPage } from './features/sanction-list/SanctionListManagementPage';
import { FilteringRequestManagementPage } from './features/filtering-requests/FilteringRequestManagementPage';
import { MessageConversionPage } from './features/message-conversions/MessageConversionPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import type { PageId } from './types/navigation';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [navigationMenu, setNavigationMenu] = useState<Menu[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleExpiredSession = () => setSession(null);
    window.addEventListener('auth:session-expired', handleExpiredSession);
    return () => window.removeEventListener('auth:session-expired', handleExpiredSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setNavigationMenu([]);
      return;
    }
    const controller = new AbortController();
    void menuService.getMine(controller.signal)
      .then(setNavigationMenu)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setNavigationMenu([]);
      });
    return () => controller.abort();
  }, [session]);

  const handleAuthenticated = (authenticatedSession: AuthSession) => {
    saveAuthSession(authenticatedSession);
    setSession(authenticatedSession);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    if (!session || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authService.logout(session.refreshToken);
    } catch {
      // Always clear the local session even when the backend is unavailable.
    } finally {
      clearAuthSession();
      setSession(null);
      setCurrentPage('dashboard');
      setIsLoggingOut(false);
    }
  };

  const handlePasswordChanged = () => {
    clearAuthSession();
    setSession(null);
    setCurrentPage('dashboard');
  };

  if (!session) return <LoginPage onAuthenticated={handleAuthenticated} />;

  const page = currentPage === 'profile'
    ? <ProfilePage fallbackUser={session.user} onPasswordChanged={handlePasswordChanged} />
    : currentPage === 'users'
    ? <UserManagementPage />
    : currentPage === 'groups'
      ? <GroupManagementPage />
      : currentPage === 'audits'
        ? <AuditLogsPage />
        : currentPage === 'menus'
          ? <MenuManagementPage />
          : currentPage === 'menu-groups'
            ? <MenuGroupManagementPage />
            : currentPage === 'message-management'
              ? <MessageManagementPage />
              : currentPage === 'correspondents'
                ? <CorrespondentManagementPage />
                : currentPage === 'parameter'
                  ? <AppParameterManagementPage />
                  : currentPage === 'sftp-config'
                  ? <SftpConfigManagementPage />
                  : currentPage === 'scheduler-config'
                    ? <SchedulerConfigManagementPage />
                    : currentPage === 'sftp-log'
                      ? <SftpLogPage />
                      : currentPage === 'transaction-log'
                        ? <TransactionLogPage />
                      : currentPage === 'sanction-list'
                        ? <SanctionListManagementPage />
                        : currentPage === 'sanction-filtering'
                          ? <FilteringRequestManagementPage />
                          : currentPage === 'mx-mt-converter'
                            ? <MessageConversionPage />
                          : <DashboardPage />;

  return (
    <AdminLayout
      currentPage={currentPage}
      username={session.user.username}
      isLoggingOut={isLoggingOut}
      onNavigate={setCurrentPage}
      onLogout={() => void handleLogout()}
      navigationMenu={navigationMenu}
    >
      {page}
    </AdminLayout>
  );
}
