
// This apiClient is a lightweight fetch wrapper for communicating with the backend server.

// The backend URL will be resolved relative to the current host, assuming a proxy setup.
const BASE_URL = '/api';


const request = async (method: 'GET' | 'POST', endpoint: string, payload?: any) => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (payload) {
        options.body = JSON.stringify(payload);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!response.ok) {
            // NEW: Specifically handle 404s as a routing issue.
            if (response.status === 404) {
                 throw new Error('Backend service not found (404). This strongly indicates a routing misconfiguration. Please check your `firebase.json` and Cloud Run service name/region.');
            }

            let errorData;
            if (isJson) {
                errorData = await response.json();
            } else {
                // If the response is not JSON, it could be an HTML error page (e.g., from a proxy)
                const textResponse = await response.text();
                // Check for HTML response, which often indicates a routing issue
                if (textResponse.trim().toLowerCase().startsWith('<!doctype html')) {
                    throw new Error('API request failed: The server responded with a webpage instead of data. This is likely a routing misconfiguration in the hosting environment.');
                }
                errorData = { message: `HTTP error! status: ${response.status}` };
            }
            throw new Error(errorData.message || 'An unknown API error occurred.');
        }

        if (isJson) {
            return response.json();
        }
        return { success: true };

    } catch (error) {
        console.error(`[API Client Error] ${method} ${endpoint}:`, error);
        throw error;
    }
};

export const apiClient = {
    get: (endpoint: string) => request('GET', endpoint),
    post: (endpoint: string, payload: any) => request('POST', endpoint, payload),
};