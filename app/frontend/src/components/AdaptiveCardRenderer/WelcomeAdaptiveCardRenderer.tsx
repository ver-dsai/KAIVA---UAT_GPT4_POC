// 11Sep2024: created new welcome adaptive card with the code in tsx and created WelcomeAdaptiveCard.json

import React, { useEffect, useRef } from "react";
import * as AdaptiveCards from "adaptivecards"; // Import AdaptiveCards
import "./AdaptiveCardRenderer.css"; // Import the existing CSS for consistency
import welcomeCardJson from "./WelcomeAdaptiveCard.json"; // Import the JSON file

interface AdaptiveCardRendererProps { //interface: for defining the structure and datatype that an object or function param must conform to 
  username: string | null; //in this case, define the shape of an obj that will hold the props for the AdaptiveCardRenderer component
  // 23 Sept: added in user's email
  email: string | null; 
}

// 23 Sept: modified the code to also include email as input property
const WelcomeAdaptiveCardRenderer: React.FC<AdaptiveCardRendererProps> = ({ username, email }) => { //WelcomeAdaptiveCardRenderer is a var assigned to hold the react functional component, the react FC expects a prop called username of type string or null. ({ username }):property 'username' is extracted and passed into the function
  const cardContainerRef = useRef<HTMLDivElement>(null); //useRef<HTMLDivElement>: ref to a div in the DOM 

  useEffect(() => {
    if (cardContainerRef.current) {
      const adaptiveCard = new AdaptiveCards.AdaptiveCard();

      // Clone the JSON to avoid modifying the original file
      const card = JSON.parse(JSON.stringify(welcomeCardJson));

      // Log the card's body to verify JSON indexing
      console.log(card.body);

      // Inject the username into the adaptive card
      if (username) {
        card.body[0].text = `Welcome, ${username}`;
      }
      // 23 Sept: Added in logic for displaying email on adaptive card
      if (email) {
        card.body[1].text = `You are currently logged in as: ${email}`;  // Assuming you want to display the email in the second position
      }

      // Parse and render the card
      adaptiveCard.parse(card);
      const renderedCard = adaptiveCard.render();

    //   // Append the rendered card to the container
    //   cardContainerRef.current.innerHTML = ""; // Clear previous content
    //   cardContainerRef.current.appendChild(renderedCard);

      // Check if renderedCard is not undefined before appending - bec appendChild cannot accept undefined renderedCard
      if (renderedCard) {
        // Clear the container before appending the new card
        cardContainerRef.current.innerHTML = ""; // Clear previous content
        cardContainerRef.current.appendChild(renderedCard); // Safely append rendered card
      }

    }
  }, [username, email]); // Re-run when username changes //23 Sept included

  return (
    <div className="container">
      <div ref={cardContainerRef}></div> {/* Adaptive Card is rendered here */}
    </div>
  );
};

export default WelcomeAdaptiveCardRenderer;
