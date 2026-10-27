import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import './index.css';

// The app is mounted only after the session check, and is remounted when the signed-in user changes,
// so no screen state or per-user local data can leak from one account to another.
function Root() {
  const auth = useAuth();
  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex items-center justify-center font-mono text-xs text-[#74736F]">
        Загрузка...
      </div>
    );
  }
  return <App key={auth.user?.id ?? 'anonymous'} />;
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);
