import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.body?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        <Logo className="text-2xl mb-8 mx-auto" />
        <div className="text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Admin console</h1>
          <p className="mt-1 text-muted-foreground">Sign in with your Fineract admin credentials.</p>
        </div>

        {error && <p className="mt-5 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-2 w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
              placeholder="mifos"
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full border border-input rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </label>
          <button
            disabled={loading || !username || !password}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
