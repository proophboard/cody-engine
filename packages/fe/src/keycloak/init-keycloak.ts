import {getConfiguredKeycloak} from "@frontend/keycloak/get-configured-keycloak";

let isInitialized = false; // This flag will check if we've initialized Keycloak
const keycloakInstance = getConfiguredKeycloak();

export const initKeycloak = async (onAuthenticatedCallback: () => void): Promise<void> => {
  if (!isInitialized) {
    isInitialized = true; // Mark as initialized
    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'login-required',
        silentCheckSsoFallback: false,
        checkLoginIframe: false,
      });

      if (authenticated) {
        onAuthenticatedCallback();
      } else {
        console.warn("Not authenticated!");
        keycloakInstance.login();
      }
    } catch (error) {
      isInitialized = false;
      console.error("Keycloak initialization error:", error);
    }
  }
};

// Default access token lifetime in KC is 5 min, by default we set minValidity higher than max token validity to force a refresh
export const refreshToken = async (minValidity = (61*5)): Promise<boolean> => {
  if(!isInitialized) {
    return false;
  }

  return keycloakInstance.updateToken(minValidity);
}

