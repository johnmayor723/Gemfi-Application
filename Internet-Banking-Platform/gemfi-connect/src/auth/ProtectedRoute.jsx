import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBankAuth } from '@/auth/AuthProvider';
export default function ProtectedRoute() {
  const { isAuthenticated } = useBankAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}