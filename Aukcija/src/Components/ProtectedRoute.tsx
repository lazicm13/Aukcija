import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./../api";

interface ProtectedRouteProps {
    children: React.ReactNode; // Specify the type for children
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // Set the initial state type
    const navigate = useNavigate();
   
    useEffect(() => {
        const checkAuthorization = async () => {
            const loggedIn = await checkUserLoggedIn();
            setIsAuthorized(loggedIn);
        };

        checkAuthorization();
    }, []);

    if (isAuthorized === null) return <div>Loading...</div>;

    if(!isAuthorized) return;
    return <>{children}</>;
};

const checkUserLoggedIn = async () => {
    try {
        const response = await api.get('/api/user/status/');
        return response.data.is_authenticated; // Assuming the API returns an object with 'is_authenticated'
    } catch (error) {
        console.error("Error checking user status:", error);
        return false; // If there's an error, assume user is not authenticated
    }
};

export default ProtectedRoute;
