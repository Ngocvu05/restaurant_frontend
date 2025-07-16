import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface Props {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
