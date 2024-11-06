// Refactored from https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/blob/main/1-Authentication/1-sign-in/SPA/src/authConfig.js

// import { IPublicClientApplication, LogLevel, Configuration } from "@azure/msal-browser";

// const appServicesAuthTokenUrl = ".auth/me";
// const appServicesAuthTokenRefreshUrl = ".auth/refresh";
// const appServicesAuthLogoutUrl = ".auth/logout?post_logout_redirect_uri=/";

// interface AppServicesToken {
//     id_token: string;
//     access_token: string;
//     user_claims: Record<string, any>;
// }

// interface AuthSetup {
//     useLogin: boolean;
//     requireAccessControl: boolean;
//     msalConfig: {
//         auth: {
//             clientId: string; // Client app id used for login
//             authority: string; // Directory to use for login https://learn.microsoft.com/azure/active-directory/develop/msal-client-application-configuration#authority
//             redirectUri: string; // Points to window.location.origin. You must register this URI on Azure Portal/App Registration.
//             postLogoutRedirectUri: string; // Indicates the page to navigate after logout.
//             navigateToLoginRequestUrl: boolean; // If "true", will navigate back to the original request location before processing the auth code response.
//         };
//         cache: {
//             cacheLocation: string; // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
//             storeAuthStateInCookie: boolean; // Set this to "true" if you are having issues on IE11 or Edge
//         };
//     };
//     loginRequest: {
//         /**
//          * Scopes you add here will be prompted for user consent during sign-in.
//          * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
//          * For more information about OIDC scopes, visit:
//          * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
//          */
//         scopes: Array<string>;
//     };
//     tokenRequest: {
//         scopes: Array<string>;
//     };
// }

// // Fetch the auth setup JSON data from the API if not already cached
// async function fetchAuthSetup(): Promise<AuthSetup> {
//     const response = await fetch("/auth_setup");
//     if (!response.ok) {
//         throw new Error(`auth setup response was not ok: ${response.status}`);
//     }
//     return await response.json();
// }

// const authSetup = await fetchAuthSetup();

// export const useLogin = authSetup.useLogin;

// export const requireAccessControl = authSetup.requireAccessControl;

// /**
//  * Configuration object to be passed to MSAL instance on creation.
//  * For a full list of MSAL.js configuration parameters, visit:
//  * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
//  */
// // export const msalConfig = authSetup.msalConfig;
// // Configuration for MSAL
// export const msalConfig: Configuration = {
//     auth: {
//         clientId: "YOUR_CLIENT_ID", // Replace with your Entra ID Application (client) ID
//         authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Entra ID Tenant ID
//         redirectUri: "http://localhost:3000", // Replace with your redirect URI
//         postLogoutRedirectUri: "http://localhost:3000", // Replace with your post-logout redirect URI
//     },
//     cache: {
//         cacheLocation: "localStorage", // or "sessionStorage"
//         storeAuthStateInCookie: false, // set to true if you're having issues on IE11 or Edge
//     },
//     system: {
//         loggerOptions: {
//             loggerCallback: (level, message, containsPii) => {
//                 if (containsPii) {
//                     return;
//                 }
//                 switch (level) {
//                     case LogLevel.Error:
//                         console.error(message);
//                         break;
//                     case LogLevel.Info:
//                         console.info(message);
//                         break;
//                     case LogLevel.Verbose:
//                         console.debug(message);
//                         break;
//                     case LogLevel.Warning:
//                         console.warn(message);
//                         break;
//                 }
//             },
//         },
//     },
// };

// /**
//  * Scopes you add here will be prompted for user consent during sign-in.
//  * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
//  * For more information about OIDC scopes, visit:
//  * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
//  */
// // export const loginRequest = authSetup.loginRequest;
// // Request configuration
// export const loginRequest = {
//     scopes: ["User.Read"],
// };

// const tokenRequest = authSetup.tokenRequest;

// // Build an absolute redirect URI using the current window's location and the relative redirect URI from auth setup
// export const getRedirectUri = () => {
//     return window.location.origin + authSetup.msalConfig.auth.redirectUri;
// };

// // Get an access token if a user logged in using app services authentication
// // Returns null if the app doesn't support app services authentication
// const getAppServicesToken = (): Promise<AppServicesToken | null> => {
//     return fetch(appServicesAuthTokenRefreshUrl).then(r => {
//         if (r.ok) {
//             return fetch(appServicesAuthTokenUrl).then(r => {
//                 if (r.ok) {
//                     return r.json().then(json => {
//                         if (json.length > 0) {
//                             return {
//                                 id_token: json[0]["id_token"] as string,
//                                 access_token: json[0]["access_token"] as string,
//                                 user_claims: json[0]["user_claims"].reduce((acc: Record<string, any>, item: Record<string, any>) => {
//                                     acc[item.typ] = item.val;
//                                     return acc;
//                                 }, {}) as Record<string, any>
//                             };
//                         }

//                         return null;
//                     });
//                 }

//                 return null;
//             });
//         }

//         return null;
//     });
// };

// export const appServicesToken = await getAppServicesToken();

// // Sign out of app services
// // Learn more at https://learn.microsoft.com/azure/app-service/configure-authentication-customize-sign-in-out#sign-out-of-a-session
// export const appServicesLogout = () => {
//     window.location.href = appServicesAuthLogoutUrl;
// };

// // Determine if the user is logged in
// // The user may have logged in either using the app services login or the on-page login
// export const isLoggedIn = (client: IPublicClientApplication | undefined): boolean => {
//     return client?.getActiveAccount() != null || appServicesToken != null;
// };

// // Get an access token for use with the API server.
// // ID token received when logging in may not be used for this purpose because it has the incorrect audience
// // Use the access token from app services login if available
// export const getToken = (client: IPublicClientApplication): Promise<string | undefined> => {
//     if (appServicesToken) {
//         return Promise.resolve(appServicesToken.access_token);
//     }

//     return client
//         .acquireTokenSilent({
//             ...tokenRequest,
//             redirectUri: getRedirectUri()
//         })
//         .then(r => r.accessToken)
//         .catch(error => {
//             console.log(error);
//             return undefined;
//         });
// };




// ver: updated library import to include PublicClientApplication
// import { Configuration, LogLevel, IPublicClientApplication } from "@azure/msal-browser";
import { Configuration, LogLevel, IPublicClientApplication, PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

// URLs for App Services authentication
const appServicesAuthTokenUrl = ".auth/me";
const appServicesAuthTokenRefreshUrl = ".auth/refresh";
const appServicesAuthLogoutUrl = ".auth/logout?post_logout_redirect_uri=/";

// Interface for App Services Token
interface AppServicesToken {
    id_token: string;
    access_token: string;
    user_claims: Record<string, any>;
}

// Interface for Authentication Setup
interface AuthSetup {
    useLogin: boolean;
    requireAccessControl: boolean;
    msalConfig: Configuration;
    loginRequest: {
        scopes: Array<string>;
    };
    tokenRequest: {
        scopes: Array<string>;
    };
}


////////// Ver: Added codes for msalConfig.tsx - MSAL Configuration for Azure Authentication ///////////////////////////


// import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "a043858e-d00e-40e5-a491-d9f9a02e1aa2",  // Your Azure AD App Registration Client ID //currently using UAT development KAIVA version's clientID, to be updated for prod version
    authority: "https://login.microsoftonline.com/c1a5f3d0-0f2b-49a8-b7f8-baf494155ee7",  // Your Tenant ID or Authority
    //comment out original logic for redirectURI - redirect back to the application //to update redirect uri for prod version url
    // // for local testing:
    // redirectUri: 'http://localhost:50505/' //"https://app-backend-px5hwy56ocjy2.azurewebsites.net/" //"http://localhost:50505/"//"https://app-backend-px5hwy56ocjy2.azurewebsites.net/.auth/login/aad/callback" //callback hv error during deployemnt //updated to use the prod link //"http://127.0.0.1:50505/" //window.location.origin,  // Automatically handles local/prod URLs
    //for UAT testing:
    redirectUri: "https://app-backend-px5hwy56ocjy2.azurewebsites.net/"


    // // TO TEST OUT THE BELOW CODE FOR MAKING redirectURI DYNAMIC ONCE SETTLE registation of redirectURI in SPA instead of Web
    // // ver: 20 Sept - updated code to make it dynamic for local and production deployment
    // // doesnt work
    // redirectUri: process.env.NODE_ENV === "production" 
    //         ? "https://app-backend-px5hwy56ocjy2.azurewebsites.net/"
    //         : "http://localhost:50505/"
  },
  cache: {
    cacheLocation: "localStorage",  // Cache tokens in localStorage for silent authentication
    storeAuthStateInCookie: false,  // Optional: true for older browsers
  },
};


// Create an instance of PublicClientApplication using msalConfig (inserted here)
export const msalInstance = new PublicClientApplication(msalConfig);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Fetch the auth setup JSON data from the API if not already cached
async function fetchAuthSetup(): Promise<AuthSetup> {
    const response = await fetch("/auth_setup");
    if (!response.ok) {
        throw new Error(`auth setup response was not ok: ${response.status}`);
    }
    return await response.json();
}

// Fetch the configuration and export relevant constants
const authSetup: AuthSetup = await fetchAuthSetup();

export const useLogin = authSetup.useLogin;
export const requireAccessControl = authSetup.requireAccessControl;

// // ver: commented out the old version of loginRequest and updated the logic
// export const loginRequest = authSetup.loginRequest;
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "offline_access"]
};

export const tokenRequest = authSetup.tokenRequest;

// Build an absolute redirect URI using the current window's location and the relative redirect URI from auth setup
export const getRedirectUri = () => {
    return window.location.origin + authSetup.msalConfig.auth.redirectUri;
};

// Get an access token if a user logged in using app services authentication
const getAppServicesToken = (): Promise<AppServicesToken | null> => {
    return fetch(appServicesAuthTokenRefreshUrl).then(r => {
        if (r.ok) {
            return fetch(appServicesAuthTokenUrl).then(r => {
                if (r.ok) {
                    return r.json().then(json => {
                        if (json.length > 0) {
                            return {
                                id_token: json[0]["id_token"] as string,
                                access_token: json[0]["access_token"] as string,
                                user_claims: json[0]["user_claims"].reduce((acc: Record<string, any>, item: Record<string, any>) => {
                                    acc[item.typ] = item.val;
                                    return acc;
                                }, {}) as Record<string, any>
                            };
                        }
                        return null;
                    });
                }
                return null;
            });
        }
        return null;
    });
};

export const appServicesToken = await getAppServicesToken();

// Sign out of app services
export const appServicesLogout = () => {
    window.location.href = appServicesAuthLogoutUrl;
};

// Determine if the user is logged in
export const isLoggedIn = (client: IPublicClientApplication | undefined): boolean => {
    return client?.getActiveAccount() != null || appServicesToken != null;
};

/////////////////////////  ver: commented out the original code and modified the code //////////////////////
// // Get an access token for use with the API server
// export const getToken = (client: IPublicClientApplication): Promise<string | undefined> => {
//     if (appServicesToken) {
//         return Promise.resolve(appServicesToken.access_token);
//     }

//     return client
//         .acquireTokenSilent({
//             ...tokenRequest,
//             redirectUri: getRedirectUri()
//         })
//         .then(r => r.accessToken)
//         .catch(error => {
//             console.log(error);
//             return undefined;
//         });
// };

// //ver: commenting out modified version and replacing with a newer verion
// // Get an access token for use with the API server
// export const getToken = async (client: IPublicClientApplication | null = null): Promise<string | undefined> => {
//   if (appServicesToken) {
//       return Promise.resolve(appServicesToken.access_token);
//   }

//   // Use the MSAL instance to acquire a token silently if no app services token is available
//   if (client || msalInstance) {
//       try {
//           const tokenResponse = await (client || msalInstance).acquireTokenSilent({
//               scopes: [...tokenRequest.scopes],
//               redirectUri: getRedirectUri(),
//           });
//           return tokenResponse.accessToken;
//       } catch (error) {
//           console.log("Silent token acquisition failed: ", error);
//           return undefined;
//       }
//   }

//   return undefined;
// };

// Get an access token for use with the API server
export const getToken = async (client: IPublicClientApplication | null = null): Promise<string | undefined> => {
  if (appServicesToken) {
    // Return app services token if available
    return Promise.resolve(appServicesToken.access_token);
  }

  // Ensure the client or msalInstance is available for token acquisition
  const authClient = client || msalInstance;
  if (!authClient) {
    console.error("MSAL client is not available.");
    return undefined;
  }

  try {
    // Try to acquire token silently
    const tokenResponse = await authClient.acquireTokenSilent({
      scopes: [...tokenRequest.scopes], // Ensure you're requesting correct scopes
      redirectUri: getRedirectUri(), // Ensure redirect URI is correctly set
    });
    // If token is acquired, return it
    console.log("Token acquired silently:", tokenResponse.accessToken);    
    // If token is acquired, return it
    return tokenResponse.accessToken;
  } catch (error) {
    // Log the error to check why silent token acquisition failed
    console.log("Silent token acquisition failed: ", error);

    // If silent acquisition fails, try interactive login as a fallback
    if (error instanceof InteractionRequiredAuthError) {
      // Log that we need user interaction
      // via full page redirect
      console.log("Interaction required, attempting acquireTokenRedirect");

      // // version of try-catch for popup window (mtd 1)
      // console.log("Interaction required, attempting acquireTokenPopup");

      // try {
      //   // Try to acquire token via a popup window (or use acquireTokenRedirect for redirection)
      //   const tokenResponse = await authClient.acquireTokenPopup({
      //     scopes: [...tokenRequest.scopes], // Request the necessary scopes
      //     redirectUri: getRedirectUri(),
      //   });
      //   // Log and return the interactively acquired token
      //   console.log("Token acquired interactively:", tokenResponse.accessToken);
      //   // If token is acquired, return it
      //   return tokenResponse.accessToken;
      // } catch (popupError) {
      //   // Log if popup acquisition fails
      //   console.error("Token acquisition via popup failed: ", popupError);
      // }

      // version of try-catch for full page redirect (mtd 2)
      try {
        await authClient.acquireTokenRedirect({
            scopes: [...tokenRequest.scopes],
            redirectUri: getRedirectUri(),
        });
        // The redirection will happen, and this code will not execute further until the user is authenticated.
    } catch (redirectError) {
        console.error("Token acquisition via redirect failed: ", redirectError);
    }      

    } else {
      // Handle any other errors that might occur during silent token acquisition
      console.error("Non-interactive error: ", error);
    }
  }

  // If all attempts fail, return undefined
  return undefined;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
