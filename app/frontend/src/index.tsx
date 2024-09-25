import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType, AccountInfo } from "@azure/msal-browser";
import { msalConfig, useLogin } from "./authConfig";

import "./index.css";

import Layout from "./pages/layout/Layout";
import Chat from "./pages/chat/Chat";

// ver added in this line
initializeIcons();

// Create MSAL instance outside the render method to prevent recreation on each render
const msalInstance = new PublicClientApplication(msalConfig);

// Default to using the first account if no account is active on page load
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

// Listen for sign-in event and set active account
msalInstance.addEventCallback(event => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const account = event.payload as AccountInfo;
        msalInstance.setActiveAccount(account);
    }
});

// var layout;

// if (useLogin) {
//     var msalInstance = new PublicClientApplication(msalConfig); //MSAL instance

//     // Default to using the first account if no account is active on page load
//     if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {

// //////////////////// ver: commented out original code and modified the original code ////////////////////
//         // // Account selection logic is app dependent. Adjust as needed for different use cases.
//         // msalInstance.setActiveAccount(msalInstance.getActiveAccount());

//         // Automatically select the first available account
//         msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
// ////////////////////////////////////////////////////////////////////////////////////////////////////////
//     }

//     // Listen for sign-in event and set active account
//     msalInstance.addEventCallback(event => {
//         if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
//             const account = event.payload as AccountInfo;
//             msalInstance.setActiveAccount(account);
//         }
//     });

//     layout = (
//         <MsalProvider instance={msalInstance}>
//             <Layout />
//         </MsalProvider>
//     );
// } else {
//     layout = <Layout />;
// }



// if (useLogin) {
//     var msalInstance = new PublicClientApplication(msalConfig); // MSAL instance

//     // Default to using the first account if no account is active on page load
//     if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {

//         //////////////////// ver: commented out original code and modified the original code ////////////////////
//         // Automatically select the first available account if no account is already active
//         msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
//         ////////////////////////////////////////////////////////////////////////////////////////////////////////
//     }

//     // Listen for sign-in events and set the active account
//     msalInstance.addEventCallback(event => {
//         if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
//             const account = event.payload as AccountInfo;
//             msalInstance.setActiveAccount(account); // Update the active account after login success
//         }
//     });

//     // Ensure the `MsalProvider` correctly wraps your Layout component to provide authentication context
//     layout = (
//         <MsalProvider instance={msalInstance}>
//             <Layout />
//         </MsalProvider>
//     );
// } else {
//     // If `useLogin` is false, just render the Layout without MSAL provider
//     layout = <Layout />;
// }

// //ver: commented out this line
// initializeIcons();

const router = createHashRouter([
    {
        path: "/",
        element: <Layout />, // Use the Layout component for routing
        // element: layout, // commented out this original line
        children: [
            {
                index: true,
                element: <Chat />
            },
            {
                path: "qa",
                lazy: () => import("./pages/ask/Ask")
            },
            {
                path: "*",
                lazy: () => import("./pages/NoPage")
            }
        ]
    }
]);


// // ver: commented out the original
// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//     <React.StrictMode>
//         <RouterProvider router={router} />
//     </React.StrictMode>
// );

// Render the app
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        {/* Wrap the entire app with MsalProvider to provide authentication context */}
        <MsalProvider instance={msalInstance}>
            <RouterProvider router={router} />
        </MsalProvider>
    </React.StrictMode>
);
