import React, { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { UserContext } from "../context/userContext";

export default function PrivateRoute() {
  const [state] = useContext(UserContext);

  if (!state.isLogin) return <Navigate to="/" />;

  // Jika admin, arahkan ke dashboard admin
  // if (state.user.is_admin === true) return <Navigate to="/admin/dashboard" />;

  return <Outlet />;
}
