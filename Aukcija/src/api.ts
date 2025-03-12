import axios, { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie"; // Ensure to import the Cookies library

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

// Helper function to fetch CSRF token
async function fetchCsrfToken() {
    try {
        const response = await axios.get(`https://api.velikaaukcija.com/api/csrf/`);
        const csrftoken = response.data.csrftoken; // Adjust this based on your API response
        Cookies.set('csrftoken', csrftoken, { domain: '.velikaaukcija.com', secure: true, sameSite: 'None' });
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
    }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Axios request interceptor
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Attempt to get the CSRF token from cookies
        let csrfToken = Cookies.get('csrftoken');

        // If the token is not available, fetch it from the server
        if (!csrfToken) {
            await fetchCsrfToken(); // Only fetch if not available
            csrfToken = Cookies.get('csrftoken'); // Get the token again after fetching
        }
        

        // console.log('Token:', csrfToken);
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken; // Add token to headers
            // console.log("Adding CSRF Token:", csrfToken);
        } else{
            // console.log("No CSRF token available.");
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
