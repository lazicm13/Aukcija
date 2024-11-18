import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

type AdminRouteProps = {
    isAdmin: boolean;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ isAdmin }) => {
    return isAdmin ? <Outlet /> : <Navigate to="/*" />;
};

export default AdminRoute;
