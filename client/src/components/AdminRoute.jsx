import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../context/userContext';

const AdminRoute = () => {
  const [state] = useContext(UserContext);

  if (!state.isLogin) return <Navigate to="/" />;
  if (!state.user.is_admin) return <Navigate to="/profile" />;

  return <Outlet />;
};

export default AdminRoute;

