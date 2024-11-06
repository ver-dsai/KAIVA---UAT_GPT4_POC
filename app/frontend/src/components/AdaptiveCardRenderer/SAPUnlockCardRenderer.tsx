import React, { useState, useEffect, useRef } from "react";
import * as AdaptiveCards from "adaptivecards";
import envSelectionCardJson from "./SAPUnlock_EnviroSelectionCard.json";
import systemSelectionCardJson from "./SAPUnlock_SystemSelectionCard.json";
import confirmationCardJson from "./SAPUnlock_ConfirmationCard.json";
// import "./AdaptiveCardRenderer.css"; // Import the CSS file
import "./AdaptiveCardRendererUnlock.css"; // Import the CSS file


// Possible API responses:
// 1. User XXX has been unlocked in <enviro + system name>
// 2. User XXX is not locked in <enviro + system name>
// 3. Invalid SAP User for email <XXXX>. Please contact Servie Desk for assistance. <- this will appear if not SAP user or if got issue in retrieving SAP userID in selected system.




// Define a type for your form data
type FormData = { //type alias - giving a name to an object. the object cant be changed after being created, cannot add new properties
    environment?: string; //holds the value of the environment the user selects
    system?: string; //holds the system value that the user selected from the system selection Adaptive Card.
    body?: { [key: string]: any }; //for storing any additional form data from the Adaptive Card. It could include inputs like email or other fields required for the API call.
    headers?: { [key: string]: string }; //{ [key: string]: any }: define headers as an dict object with key value pairs. keys must be string and values must be string //where any custom headers (like Authorization or Content-Type) required for the API call are stored.
    action?: string;  //holds the action that the user selected, such as selectEnvironment, selectSystem, or confirmSelections from the Adaptive Card
    goBackChoice?: string; // Add the goBackChoice property for "go back" functionality. #optional: (?:)
  };
  
  interface SAPUnlockCardRendererProps { //interface alias - also giving name to an object, the interface object can be extendable
    email: string | null; // Receive email as a prop
    username: string | null; // Receive username as a prop
  }


  //Define React functional component SAPUnlockCardRenderer with email and username property passed in as a input to the FC
  const SAPUnlockCardRenderer: React.FC<SAPUnlockCardRendererProps> = ({ email, username }) => {
    const cardContainerRef = useRef<HTMLDivElement>(null); //creates a reference to a part of the user interface, specifically an HTML <div> element. 
    const [loading, setLoading] = useState<boolean>(false); //state variable called loading that starts with a value of false. The second part, setLoading, is a function to update the value of loading
    const [result, setResult] = useState<any>(null);
    const [actionData, setActionData] = useState<FormData>({}); //actionData - holds the form data as a dictionary
    const [bodyData, setBodyData] = useState<{ [key: string]: any }>({});//bodyData is an empty object, but its type is defined as a dictionary-like structure where each key is a string, and the value can be any type. This is used to hold key-value data.
    const [cardVisible, setCardVisible] = useState<boolean>(true);
    const [logMessage, setLogMessage] = useState<string>("");
    const [currentCard, setCurrentCard] = useState<"environment" | "system" | "confirmation">("environment"); //currentCard is a state variable that can only hold one of three specific values: "environment", "system", or "confirmation". It starts with "environment". This likely tracks what part of the UI (which card) is currently being displayed. First assign the value environment.
    
    

    useEffect(() => { //useEffect hook: "watcher" in React that runs when certain conditions change. In this case, the hook runs whenever cardVisible or currentCard is updated.
      if (cardVisible) {
        const adaptiveCard = new AdaptiveCards.AdaptiveCard(); //AdaptiveCard() is an object from the Adaptive Cards library, which allows you to display interactive UI cards
        let cardJson; //is declaring a variable named cardJson, dont assign a value first //it will store the JSON data that defines the structure of an Adaptive Card.
  
        // Load the correct JSON based on the current card (environment, system, or confirmation)
        if (currentCard === "environment") {
          cardJson = envSelectionCardJson;
          cardJson.body[0].text = `Dear ${username}, please select the system environment to unlock your SAP or BW account:`; //Display text on the adaptive card
        } else if (currentCard === "system") {
          cardJson = systemSelectionCardJson;
          // cardJson.body[0].text = `Please select the system for the ${actionData?.environment} environment:`; //Display text on the adaptive card
          cardJson.body[0].text = `Please select the system in your ${actionData?.environment} environment to unlock your account:`; //Display text on the adaptive card
        } else if (currentCard === "confirmation") {
          // VERSION 2:
          // /////// Updated code for bolding of dynamic values of enviro, syst, user email
          // // Deep copy of the confirmation card JSON
          // cardJson = JSON.parse(JSON.stringify(confirmationCardJson));
          
          // // Direct text assignment for dynamic values
          // cardJson.body[1].columns[1].items[0].text = actionData.environment || "Not selected";
          // cardJson.body[2].columns[1].items[0].text = actionData.system || "Not selected";
          // cardJson.body[3].columns[1].items[0].text = email || "Not available";

          // VERSION 3:
          // /////// Updated code for bolding of dynamic values of enviro, syst, user email
          // // Deep copy of the confirmation card JSON
          cardJson = JSON.parse(JSON.stringify(confirmationCardJson)); //first converts confirmationCardJson obj to JSON string // parse json string back to new javascript obj

          // Set dynamic values for Environment, System, and Email
          cardJson.body[1].inlines[1].text = actionData.environment || "Not selected"; //sets the text property of a TextRun element inside RichTextBlock located at body[1] in the cardJson. //cardJson.body[1] refers to the second element in the body array of cardJson (the array indexing starts at 0). //inlines[1] accesses the second TextRun element within the RichTextBlock at body[1], which holds the dynamic value for "Environment."
          cardJson.body[2].inlines[1].text = actionData.system || "Not selected";
          cardJson.body[3].inlines[1].text = email || "Not available";
          ////////////////////////////////////////////////////////////////////////////
        }
        
        // sets up an event listener for when an action (like submitting a form) is triggered in the Adaptive Card. When the user submits card, an action obj is passed into this function
        adaptiveCard.onExecuteAction = (action: AdaptiveCards.Action) => { 
          if (action instanceof AdaptiveCards.SubmitAction && action.data) { //checks if the action is a SubmitAction (i.e., the user clicked the submit button). If the action contains data (the user input from the form).
            const data = action.data as FormData; //data property from the action object is being assigned to the variable 'data'. 'as FormData' - telling TypeScript that you expect action.data to be of type FormData (cast as FormData data struct) so that TypeScript can give you proper suggestions and catch type-related mistakes.
  
            // Handle the 'goBack' action
            if (data.action === "goBack") {
              // Determine which card to go back to based on 'goBackChoice'
              if (data.goBackChoice === "environment") {
                setCurrentCard("environment"); // Go back to environment selection
              } else if (data.goBackChoice === "system") {
                setCurrentCard("system"); // Go back to system selection
              }
              setCardVisible(true); // Ensure the card is visible
              return; // Do not proceed further; we're going back
            }

            // Handle the form submission based on the current step (environment, system, or confirmation)
            if (currentCard === "environment") { //checks if the current step is the environment selection step
              if (!data.environment) { //checks if the user has not selected an environment from the environment card.
                setLogMessage("Please select an environment to proceed."); //displays this message if user doesnt make any selection and clicks Next
                return; // Do not proceed to the next card
              }
              setActionData((prevData) => ({ ...prevData, environment: data.environment })); //environment: data.environment });  //updates the actionData state to store the selected environment (data.environment). This is the value the user entered or selected.
              
              console.log("Updated actionData with environment:", actionData);  // Debug log
              setCurrentCard("system"); // Move to system selection
              setCardVisible(true); // Ensure the next card is shown
            } else if (currentCard === "system") {
              if (!data.system) { //checks if the user has not selected a system from the system card.
                setLogMessage("Please select a system to proceed."); //displays this message if user doesnt make any selection and clicks Next
                return; // Do not proceed to the confirmation card
              }
              setActionData((prevData) => ({ ...prevData, system: data.system })); //...actionData - ensures that it keeps the previous environment data and just adds the new system data on top of it.
              
              console.log("Updated actionData with system:", actionData);  // Debug log
              setCurrentCard("confirmation"); // Move to confirmation
              setCardVisible(true); // Ensure the next card is shown
            } else if (currentCard === "confirmation") {
              //calls the handleSubmit() function -  Submit the final selections along with email
              handleSubmit({
                environment: actionData.environment, // Use actionData environment directly
                system: actionData.system,           // Use actionData system directly
                headers: data.headers || {},
                body: { ...data.body, emailAddr: email || "" }
              });
            }
  
            // Set the form body data
            setBodyData(data.body || {});
            setResult(null); // Clear previous results
          }
        };
  
        adaptiveCard.parse(cardJson);
        const renderedCard = adaptiveCard.render();
  
        if (cardContainerRef.current && renderedCard) {
          cardContainerRef.current.innerHTML = ""; // Clear any previous content
          cardContainerRef.current.appendChild(renderedCard); // Render the new card
        }
      }
    }, [cardVisible, currentCard]);
  

    // definition of the handleSubmit function - for handling the form submission and making the API call
    const handleSubmit = async (actionData: FormData) => { //input of the function is actionData which is FormData type
      const { environment, system, body, headers } = actionData; //extracts out each key from actionData

      // Log the environment and system to see if they are captured correctly
      console.log("Environment:", environment);
      console.log("System:", system);

      // Log the payload being sent to Workato API
      console.log("Payload being sent to Workato API:", {
        environment,
        system,
        emailAddr: body?.emailAddr || email // Ensure emailAddr is included
      });  

      try {
        setLoading(true); //set loading state as true to indicate that submission process started.
        setResult(null); // Clear any previous results
  
        // Log the payload being sent to the API
        console.log("Sending payload: ", {      
          environment,
          system,
          emailAddr: body?.emailAddr || email // Ensure emailAddr is included, either from body or from email state
          });

        // Make the POST request to your function app
        const response = await fetch("https://sapunlock-httptrigger.azurewebsites.net/api/submitSAPUnlock", { //To call your submitSAPUnlock function, append /api/submitSAPUnlock to this URL
          method: "POST",  // Make sure to use POST
          headers: {
            "Content-Type": "application/json",
            ...(headers || {}) // Spread custom headers if any
          },
          body: JSON.stringify({
            environment: environment, // Explicitly include the environment
            system: system,           // Explicitly include the system
            emailAddr: body?.emailAddr || email // Ensure emailAddr is included
          })
        });
  
        
        // Log the raw text response to understand what the server is returning - ADDED IN THIS
        const rawText = await response.text();
        console.log("Raw response text:", rawText); // Log raw text for debugging
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        let parsedResponse;

        if (contentType && contentType.includes("application/json")) {
          parsedResponse = JSON.parse(rawText); // Parse JSON response

        } else {
          parsedResponse = { message: rawText }; // Fallback for non-JSON response
        }
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${parsedResponse.message}`);
        }
    
        setResult(parsedResponse); // Display the response message
        
      } catch (error: any) {
        console.error("Error calling API:", error.message);
        setResult({ error: error.message }); // Show the error if any
      } finally {
        setLoading(false);
      }
    };

    
  
    // const handleBackClick = () => {
    //   setCardVisible(true); // Show the card again
    //   setResult(null); // Clear results
    //   setActionData({}); // Reset the form data
    //   setBodyData({});
    //   setLogMessage("");
    //   setCurrentCard("environment"); // Go back to the environment selection
    // };
  
    return (
      <div className="container">
        {cardVisible && (
          <div id="adaptive-card-container"> {/* Add an ID here for referencing to this in CSS styling */}
            <div ref={cardContainerRef}></div>
          </div>
        )}

        {/* Only show the "Back" button when not loading */}
        {/* {!cardVisible && !loading && (
          <button className="back-button" onClick={handleBackClick}>
            Back
          </button>
        )} */}

        {/* Loading spinner that appears while the API call is in progress */}
        {loading && (
          <div className="loading-spinner">
            <p>Loading...</p> {/* You can replace this with a spinner graphic */}
          </div>
        )}
        {logMessage && (
          <div className="log-message">
            <p>{logMessage}</p>
          </div>
        )}
        {result && !result?.error && (
          <div id="requestOutcome"> {/* Add an ID here for referencing to this in CSS styling */}
            <h3>Request Outcome:</h3>
            <pre>{result.message ? result.message : JSON.stringify(result, null, 2)}</pre> {/* Display the API message */}
          </div>
        )}
        {result?.error && (
          <div>
            <h3>Error:</h3>
            <p>{result.error}</p> {/* Display error message */}
          </div>
        )}
      </div>
    );
  };
  
  export default SAPUnlockCardRenderer;


// import React, { useEffect, useRef } from "react";
// import * as AdaptiveCards from "adaptivecards";
// import "./AdaptiveCardRenderer.css";
// import envSelectionCardJson from "./SAPUnlock_EnviroSelectionCard.json";
// import systemSelectionCardJson from "./SAPUnlock_SystemSelectionCard.json";
// import confirmationCardJson from "./SAPUnlock_ConfirmationCard.json";

// interface SAPUnlockCardRendererProps { // define the properties that will be passed into the component
//   cardType: "environment" | "system" | "confirmation"; // (to be used for rendering of the respective card - confirm card, enviro card, sys card) define cardtype variable as one of the specific string values of either enviro, system, confirmation
//   environment?: string; // define the environment property variable as a string
//   system?: string; // property var system that will contain the system type value selected by the user
//   onSubmit: (data: any) => void; // property variable onSubmit which represents a callback function that handles the submission of the form data from the adaptive card. It has input parameter data with type any and => void as the function will not return anything
// }

// const SAPUnlockCardRenderer: React.FC<SAPUnlockCardRendererProps> = ({ 
//   cardType, //properties for the SAPUnlockCardRenderer functional component
//   environment,
//   system,
//   onSubmit
// }) => {
//   const cardContainerRef = useRef<HTMLDivElement>(null); // creates a ref that points to the div where the adaptive card will be rendered, initially the reference is null. when the component mounts will point to the actual DOM element.

//   useEffect(() => { // to handle rendering of card
//     if (cardContainerRef.current) {
//       const adaptiveCard = new AdaptiveCards.AdaptiveCard();

//       let cardJson;
//       switch (cardType) { //
//         case "environment":
//           cardJson = JSON.parse(JSON.stringify(envSelectionCardJson));
//           break;
//         case "system":
//           cardJson = JSON.parse(JSON.stringify(systemSelectionCardJson));
//           if (environment) {
//             cardJson.body[0].text = `Please select the system for the ${environment} environment:`;
//           }
//           break;
//         case "confirmation":
//           cardJson = JSON.parse(JSON.stringify(confirmationCardJson));
//           if (environment) {
//             cardJson.body[1].text = `Environment: ${environment}`;
//           }
//           if (system) {
//             cardJson.body[2].text = `System: ${system}`;
//           }
//           break;
//         default:
//           cardJson = null;
//       }

//       if (cardJson) {
//         adaptiveCard.parse(cardJson);
//         const renderedCard = adaptiveCard.render();

//         if (renderedCard) {
//           cardContainerRef.current.innerHTML = "";
//           cardContainerRef.current.appendChild(renderedCard);
//         }

//         // Handle submit action and retrieve form data
//         adaptiveCard.onExecuteAction = (action) => {
//           if (action instanceof AdaptiveCards.SubmitAction) { // Ensure it's a SubmitAction
//             const formData = action.data; // Correct way to get form data from SubmitAction
//             onSubmit(formData); // Pass the form data to the parent component
//           }
//         };
//       }
//     }
//   }, [cardType, environment, system]);

//   return (
//     <div className="container">
//       <div ref={cardContainerRef}></div> {/* Adaptive Card is rendered here */}
//     </div>
//   );
// };

// export default SAPUnlockCardRenderer;


