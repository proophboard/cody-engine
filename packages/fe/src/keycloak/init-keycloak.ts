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
