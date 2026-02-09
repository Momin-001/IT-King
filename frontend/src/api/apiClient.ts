import axios from "axios";

const BASE_URL = "http://localhost:3000/";
const REFRESH_URL = "auth/refresh";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

/* This variable will be used to know if the access token is being refreshed currently.
If not null, requests will wait for this to finish. If null(token refreshed or refresh not needed),
requests will proceed*/
let refreshPromise: Promise<any> | null = null;

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const { data } = await axios.post(`${BASE_URL}${REFRESH_URL}`, {
      refreshToken,
    });

    const newToken = data.accessToken;
    localStorage.setItem("accessToken", newToken);
    console.log(`Token refreshed successfully...`);
    return newToken;
  } catch (error) {
    //If token wasn't refreshed bcz user's account is deleted or any other problem
    logout();
    throw error;
  }
}

const logout = () => {
  delete apiClient.defaults.headers.common["Authorization"]; //Deleting default header
  window.dispatchEvent(new Event("logout")); //Emitting event. will be caught by authcontext
};

apiClient.interceptors.request.use((config) => {
  //Intercept an outgoing request to add Auth Header
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  }, // if successful response, just return it
  async (error) => {
    //If a request fails
    const originalRequest = error.config;

    // Check if the error is a 401 and we haven't tried to fix it yet
    const is401 = error.response?.status === 401;
    const isAlreadyRetried = originalRequest._retry;

    //If error while Login or Refreshing, throw an error and don't refresh token(again)
    if (
      originalRequest.url.includes("/login") ||
      originalRequest.url.includes(REFRESH_URL)
    ) {
      return Promise.reject(error);
    }

    // if we already tried retrying, give up.
    if (isAlreadyRetried) {
      console.log("This 401 error was received on a retried call");
      return Promise.reject(error);
    }

    // Handle the 401
    if (is401) {
      //This means access token expired. So we refresh the token and try the request again
      originalRequest._retry = true; // Mark the failed request as retrying

      try {
        const storageToken = localStorage.getItem("accessToken");

        // Get the token that failed (handle both 'Authorization' and 'authorization')
        const failedHeader =
          originalRequest.headers["Authorization"] ||
          originalRequest.headers["authorization"];
        const failedToken = failedHeader?.split(" ")[1];

        // If we have a new token in storage that is different from the one that failed,
        // it means a refresh ALREADY happened. Don't refresh again.
        if (storageToken && failedToken && storageToken !== failedToken) {
          originalRequest.headers.Authorization = `Bearer ${storageToken}`;
          return apiClient(originalRequest);
        }

        if (!refreshPromise) {
          // if JWT access token is not being refreshed currently
          refreshPromise = refreshAccessToken(); // refresh access token. and tell other requests that token is being refreshed
          console.log("Refreshing Token...");
        }

        const newToken = await refreshPromise; // if refreshing, wait. If not, refresh

        refreshPromise = null; // This prevents incoming requests from waiting without reason

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return apiClient.request(originalRequest); // replay the request
      } catch (refreshError) {
        // If refresh fails, we must also reset the variable so we can try again later
        refreshPromise = null;
        logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
