import axios, { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie"; // Make sure to import the Cookies library

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Use the InternalAxiosRequestConfig type for the config parameter
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const csrfToken = Cookies.get('csrftoken'); // Getting CSRF token from cookies
        console.log('Token:' + csrfToken);
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken; // Adding token to headers
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
