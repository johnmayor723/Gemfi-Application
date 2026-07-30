import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to start
        </Link>
      </div>
    </main>
  );
}
