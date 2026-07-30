import { Link, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

export default function AppLayout({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo className="text-xl" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <PlusCircle className="h-4 w-4" />
              New request
            </Link>
            <span className="text-sm text-muted-foreground">{admin?.username}</span>
            <button
              onClick={doLogout}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
