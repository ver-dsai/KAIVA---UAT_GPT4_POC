import React, { useState, useEffect, useRef } from "react";
import * as AdaptiveCards from "adaptivecards";
import adaptiveCardJson from "./AdaptiveCard.json";
import "./AdaptiveCardRenderer.css"; // Import the CSS file

const AdaptiveCardRenderer: React.FC = () => {
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);
    const [actionData, setActionData] = useState<any>(null);
    const [bodyData, setBodyData] = useState<{ [key: string]: any }>({});
    const [cardVisible, setCardVisible] = useState<boolean>(true);
    const [logMessage, setLogMessage] = useState<string>("");

    useEffect(() => {
        if (cardVisible) {
            const adaptiveCard = new AdaptiveCards.AdaptiveCard();

            // Set the Adaptive Card Host Config (optional)
            adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
                fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
                // Add more host configuration options as needed
            });

            // Handle Submit action
            adaptiveCard.onExecuteAction = (action: AdaptiveCards.Action) => {
                if (action instanceof AdaptiveCards.SubmitAction && action.data) {
                    const data = action.data as { action: string; workflowId: string; apiUrl: string; method: string; headers: object; body?: object };
                    console.log("Action Data:", data);

                    setActionData(data);
                    setBodyData(data.body || {});
                    setResult(null); // Clear previous responses when new action is selected

                    // Set log message based on the selected action
                    setLogMessage(`You have selected the workflow: ${data.action}`);

                    // Automatically trigger GET request
                    if (data.method === "GET") {
                        handleSubmit(data, {});
                    }

                    // Hide the adaptive card
                    setCardVisible(false);
                }
            };

            adaptiveCard.parse(adaptiveCardJson);
            const renderedCard = adaptiveCard.render();

            // Append the rendered card to the container if it exists
            if (cardContainerRef.current && renderedCard) {
                cardContainerRef.current.innerHTML = ""; // Clear previous content
                cardContainerRef.current.appendChild(renderedCard);
            }
        }
    }, [cardVisible]);

    const handleInputChange = (field: string, value: any) => {
        setBodyData(prevState => ({
            ...prevState,
            [field]: value
        }));
    };

    const handleSubmit = async (actionData: any, body: any) => {
        const { apiUrl, method, headers } = actionData;
        try {
            setLoading(true);
            setResult(null); // Clear previous responses

            const token = process.env.REACT_APP_UIPATH_TOKEN; // Assuming you have a token for authorization

            // Read and process headers from actionData
            const requestHeaders: HeadersInit = {
                ...headers,
                "Content-Type": headers["Content-Type"] || "application/json" // Ensure content type is set
            };

            // Standardize fetch options based on the method
            const options: RequestInit = {
                method: method,
                headers: requestHeaders
            };

            if (method !== "GET") {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(apiUrl, options);

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${data}`);
            }

            setResult(data);
        } catch (error: any) {
            console.error("Error calling API:", error.message);
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleBackClick = () => {
        setCardVisible(true);
        setResult(null);
        setActionData(null);
        setBodyData({});
        setLogMessage("");
    };

    return (
        <div className="container">
            {cardVisible && <div ref={cardContainerRef}></div>}
            {!cardVisible && (
                <button className="back-button" onClick={handleBackClick}>
                    Back
                </button>
            )}
            {logMessage && (
                <div className="log-message">
                    <p>{logMessage}</p>
                </div>
            )}
            {actionData && actionData.method !== "GET" && (
                <div>
                    <h3>Please provide the following data:</h3>
                    {Object.keys(bodyData).map(field => (
                        <div className="input-group" key={field}>
                            <label>{field}:</label>
                            <input
                                type={typeof bodyData[field] === "number" ? "number" : "text"}
                                value={bodyData[field]}
                                onChange={e => handleInputChange(field, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="button-group">
                        <button className="submit-button" onClick={() => handleSubmit(actionData, bodyData)}>
                            Submit
                        </button>
                    </div>
                </div>
            )}
            <div>
                {loading && <p>Loading...</p>}
                {result && !result?.error && (
                    <div>
                        <h3>Response:</h3>
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
                {result?.error && (
                    <div>
                        <h3>Error:</h3>
                        <p>{result.error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdaptiveCardRenderer;
