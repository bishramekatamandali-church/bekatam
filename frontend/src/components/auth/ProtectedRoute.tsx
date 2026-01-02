

import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  element: React.ReactElement;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loadingAuthState } = useAuth();
  const location = useLocation();

  if (loadingAuthState) {
    // You might want to show a global loading spinner here
    // or a simple loading text while auth state is being determined.
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-slate-600 text-lg">Loading authentication status...</p>
        </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the / page if not authenticated, saving the current location they were trying to go to.
    // This allows redirecting back after login if you implement that logic.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // If it's an admin-only route and user is not admin, redirect to home or a 'not authorized' page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return element;
};

export default ProtectedRoute;