import { useRef, useState, useEffect } from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton, Slider } from "@fluentui/react";
import { SparkleFilled } from "@fluentui/react-icons";
import readNDJSONStream from "ndjson-readablestream";
import ChatLogo from "../../pages/Logos/KaivaLogo.png"; // Replace with the actual path to your logo image
import AdaptiveCardRenderer from "../../components/AdaptiveCardRenderer/AdaptiveCardRenderer";
import ACR2 from "../../components/AdaptiveCardRenderer/ACR2";

//ver 12 Sep: inlcuded import of file for the WelcomeAdaptiveCardRenderer
import WACR from "../../components/AdaptiveCardRenderer/WelcomeAdaptiveCardRenderer"; // Ensure correct import


import styles from "./Chat.module.css";

// ver 09 Sept 2024: added in the import from msal-browser
import { InteractionRequiredAuthError } from "@azure/msal-browser";
/////////////////////////////////////////////////////////////////

import {
    chatApi,
    configApi,
    RetrievalMode,
    ChatAppResponse,
    ChatAppResponseOrError,
    ChatAppRequest,
    ResponseMessage,
    VectorFieldOptions,
    GPT4VInput
} from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton";
import { ClearChatButton } from "../../components/ClearChatButton";
import { useLogin, getToken, isLoggedIn, requireAccessControl } from "../../authConfig";
import { VectorSettings } from "../../components/VectorSettings";
import { useMsal } from "@azure/msal-react";
import { TokenClaimsDisplay } from "../../components/TokenClaimsDisplay";
import { GPT4VSettings } from "../../components/GPT4VSettings";

// 26 Sept: Added additional for loginredirect
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../../authConfig"; // Your MSAL config

// 17 Oct: Imported files
import SAPUnlockCardRenderer from "../../components/AdaptiveCardRenderer/SAPUnlockCardRenderer";// Assuming you have a component to render adaptive cards
import envSelectionCardData from '../../components/AdaptiveCardRenderer/SAPUnlock_EnviroSelectionCard.json'; // Adaptive card for environment selection
import systemSelectionCardData from '../../components/AdaptiveCardRenderer/SAPUnlock_SystemSelectionCard.json'; // Adaptive card for system selection
import confirmationCardData from '../../components/AdaptiveCardRenderer/SAPUnlock_ConfirmationCard.json'; // Adaptive card for confirmation


const Chat = () => {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [temperature, setTemperature] = useState<number>(0.1);
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(RetrievalMode.Hybrid);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [shouldStream, setShouldStream] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(true);
    const [vectorFieldList, setVectorFieldList] = useState<VectorFieldOptions[]>([VectorFieldOptions.Embedding]);
    const [useOidSecurityFilter, setUseOidSecurityFilter] = useState<boolean>(false);
    const [useGroupsSecurityFilter, setUseGroupsSecurityFilter] = useState<boolean>(false);
    const [gpt4vInput, setGPT4VInput] = useState<GPT4VInput>(GPT4VInput.TextAndImages);
    const [useGPT4V, setUseGPT4V] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, response: ChatAppResponse][]>([]);
    const [streamedAnswers, setStreamedAnswers] = useState<[user: string, response: ChatAppResponse][]>([]);
    const [showGPT4VOptions, setShowGPT4VOptions] = useState<boolean>(false);
    const [showSemanticRankerOption, setShowSemanticRankerOption] = useState<boolean>(false);
    const [showVectorOption, setShowVectorOption] = useState<boolean>(false);

    //////////////////////////////////////////////////////////////////
    //ver 09 Sept: add state for storing username and ref to card container
    const { instance, accounts } = useMsal(); //extracts the instance and accounts properties returned from the useMsal hook. instance: msal instance that provides methods to login logout and get tokens for authenticated user. accounts: an array containing the detai;s of all active user accounts, if there is a logged in user their acct info will be avail in this array
    const [username, setUsername] = useState<string | null>(null); //initialise state var 'username' and function to update the username var 'setUsername'. datatype of state var 'username' is declared to be either string or null value. initial state is set as null.
    const [email, setEmail] = useState<string | null>(null); //23 Sept: Added in for user's email
    // const cardContainerRef = useRef<HTMLDivElement>(null); 

    console.log('MSAL instance:', instance); 
    /////////////////////////////////////////////////////////////

    //ver 17 Oct: add state for controlling the SAP unlock card visibility
    //New state for controlling the SAP unlock card visibility
    const [showUnlockCard, setShowUnlockCard] = useState<boolean>(false);

    ///////////////////////////////////////////////////////////////////////////////
    //ver 12 Sept: Inserted code for Msal here
    

//     /////// Code version that will present a login button if the user is not authenticated and have a popup login page /////////
//     // start of code
//     // Implement silent authentication
//     const attemptSilentAuth = async () => {
//         if (accounts.length > 0) {
//             try {
//                 const account = accounts[0];
//                 const tokenResponse = await instance.acquireTokenSilent({
//                     scopes: ["User.Read", "email"], // 23 Sept: added in email scope
//                     account: account // Use the logged-in account
//                 });
//                 setUsername(account.name || null); // Successfully authenticated silently

//                 const email = account.idTokenClaims?.email as string | undefined; // Set email from idTokenClaims and explicitly cast as string
//                 setEmail(email || null); // Set email to state
//                 // setEmail(account.idTokenClaims?.email as string || null); // Set email from idTokenClaims and explicitly cast as string

//                 //add in this line for checking
//                 console.log(account.idTokenClaims);

//             } catch (error) {
//                 if (error instanceof InteractionRequiredAuthError) {
//                     // If silent auth fails, prompt the user to log in interactively
//                     handleLogin(); // commented out since mtd 1 not used
//                 // // If silent auth fails, redirect the user to log in interactively
//                 // try {
//                 //     await instance.loginRedirect({
//                 //         scopes: ["User.Read"] // Add any additional scopes you need
//                 //     });
//                 // } catch (loginError) {
//                 //     console.error("Login redirect failed: ", loginError);
//                 // }
//                 } else {
//                     console.error("Silent authentication failed", error);
//                 }
//             }
//         }
//     };
    
//     //// Method 1: displaying a login button when the user is not authenticated:
//     // Interactive login - as fallback if silent authentication fails
//     const handleLogin = async () => {
//         try {
//             // // Use loginRedirect instead of loginPopup
//             // await instance.loginRedirect({
//             //Commented out bec not usng pop up
//             const loginResponse = await instance.loginPopup({
//                 scopes: ["User.Read", "email"] // 23 Sept: added in email scope
//             });
//             setUsername(loginResponse.account?.name || null);
//             console.log("Username: ", loginResponse.account?.name || null);  // Log the username after login
//             setEmail(loginResponse.account?.idTokenClaims?.email as string || null); // extract email and Cast email to string
//             console.log("Email: ", loginResponse.account?.idTokenClaims?.email || null); 

//             //added this line for checking
//             console.log(loginResponse.idTokenClaims);
//         } catch (error) {
//             console.error("Login failed:", error);
//         }
//     };

//     // // hide the logout button and fucntion 
//     // const handleLogout = () => {
//     //     instance.logoutPopup();
//     //     setUsername(null);
//     // };

//     // Check if user is already logged in
//     useEffect(() => {
//         if (accounts.length > 0) {
//             setUsername(accounts[0].name || null); //set username if user is already autenticated
//             // console.log("Username: ", accounts[0].name || null);  // Log the username
//             console.log("Username: ", accounts[0].name);
            
//             // 23 Sept: updated to also include email
//             setEmail(accounts[0].idTokenClaims?.email as string || null); // Set email if available
//             console.log("Email: ", accounts[0].idTokenClaims?.email);

//         } else {
//             attemptSilentAuth(); // Attempt silent authentication only if no accounts are found
//         }
//     }, [accounts]);
// ///// end of code for login via login button ////




//// Code version with full page redirect ///////


// // Implement silent authentication
// const attemptSilentAuth = async () => {
//     if (accounts.length > 0) {
//         try {
//             const account = accounts[0];
//             const tokenResponse = await instance.acquireTokenSilent({
//                 scopes: ["User.Read", "email"], // Added email scope
//                 account: account // Use the logged-in account
//             });
//             setUsername(account.name || null); // Successfully authenticated silently

//             const email = account.idTokenClaims?.email as string | undefined; // Set email from idTokenClaims and explicitly cast as string
//             setEmail(email || null); // Set email to state

    
//             // Add log for checking claims
//             console.log(account.idTokenClaims);
//         } catch (error) {
//             if (error instanceof InteractionRequiredAuthError) {
//                 // If silent auth fails, redirect the user to log in interactively
//                 instance.loginRedirect({
//                     scopes: ["User.Read", "email"] // Use loginRedirect instead of loginPopup
//                 });
//             } else {
//                 console.error("Silent authentication failed", error);
//             }
//         }
//     }
// };

// Implement silent authentication - latest
const attemptSilentAuth = async (): Promise<boolean> => {  // Ensure the return type is a boolean
    if (accounts.length > 0) {
        try {
            const account = accounts[0];
            const tokenResponse = await instance.acquireTokenSilent({
                scopes: ["User.Read", "email"], // Added email scope
                account: account // Use the logged-in account
            });
            
            // setUsername(account.name || null); // Successfully authenticated silently

            // const email = account.idTokenClaims?.email as string | undefined; // Set email from idTokenClaims and explicitly cast as string
            // setEmail(email || null); // Set email to state

            // Only update state for username and email if username or email are not already set
            if (!username) {
                setUsername(account.name || null);
            }

            const emailFromToken = account.idTokenClaims?.email as string | undefined;
            if (!email) {
                setEmail(emailFromToken || null);
            }


            // Add log for checking claims
            console.log(account.idTokenClaims);
            return true; // Silent auth successful, return true
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                console.log("Silent auth failed, interaction required");
                return false; // Silent auth failed, need to redirect
            } else {
                console.error("Silent authentication failed", error);
                return false; // Other errors
            }
        }
    } else {
        return false; // No accounts found, need to login
    }
};




// // Declare authHandled state to prevent double execution of the auth flow
// const [authHandled, setAuthHandled] = useState(false);

// Declare authHandledRef to prevent double execution of the auth flow
// use useRef instead of State - state change triggers a re-render
const authHandledRef = useRef(false);


// run useEffect hook which initialises msal to check if users are alr logged in and then calls the attempt silent authentication async function
useEffect(() => {
    if (!instance || authHandledRef.current) { //replaced authHandled
        // Don't run if MSAL instance is not ready or if auth has already been handled
        return;
    }

    // Add logging to check the accounts array
    console.log("Accounts:", accounts);

    const initAuth = async () => {
        try {
            console.log("Initializing MSAL...");

            // Call and await MSAL's initialize() method if necessary
            await instance.initialize();

            // Await handleRedirectPromise to ensure it completes before proceeding
            const redirectResponse = await instance.handleRedirectPromise(); // Wait for MSAL instance to handle redirects
            console.log("Redirect response:", redirectResponse);

            // Attempt silent authentication first
            const isAuthenticated = await attemptSilentAuth();

            // If user is not authenticated, do a full page redirect to login
            if (!isAuthenticated) {
                console.log("Redirecting to login as silent authentication failed or user not logged in");
                // If silent authentication fails or no accounts, proceed with login redirect
                await instance.loginRedirect({
                    scopes: ["User.Read", "email"]
                });
            }

            // // Set authHandled to true to prevent re-running the effect
            // setAuthHandled(true);
            authHandledRef.current = true;  // Ensure that this is called only once
        } catch (error) {
            console.error("Error handling redirect promise:", error);
        }
    };

    initAuth();

}, [instance]); // removed accounts as dependency to avoid rerun the effect when accounts changes //remove authHandled bec replaced with authHandledRef





    ///////////////////////////////////////////////////////////////////////////////

    const getConfig = async () => {
        const token = client ? await getToken(client) : undefined;

        configApi(token).then(config => {
            setShowGPT4VOptions(config.showGPT4VOptions);
            setUseSemanticRanker(config.showSemanticRankerOption);
            setShowSemanticRankerOption(config.showSemanticRankerOption);
            setShowVectorOption(config.showVectorOption);
            if (!config.showVectorOption) {
                setRetrievalMode(RetrievalMode.Text);
            }
        });
    };

    const handleAsyncRequest = async (question: string, answers: [string, ChatAppResponse][], setAnswers: Function, responseBody: ReadableStream<any>) => {
        let answer: string = "";
        let askResponse: ChatAppResponse = {} as ChatAppResponse;

        const updateState = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    answer += newContent;
                    // added if clause
                    if (askResponse && askResponse.choices && askResponse.choices[0]) {
                        const latestResponse: ChatAppResponse = {
                        ...askResponse,
                        choices: [{ ...askResponse.choices[0], message: { content: answer, role: askResponse.choices[0].message.role } }]
                        };
                        setStreamedAnswers([...answers, [question, latestResponse]]);
                    // added bracket
                    }
                    resolve(null);
                }, 33);
            });
        };
        try {
            setIsStreaming(true);
            for await (const event of readNDJSONStream(responseBody)) {
                if (event["choices"] && event["choices"][0]["context"] && event["choices"][0]["context"]["data_points"]) {
                    event["choices"][0]["message"] = event["choices"][0]["delta"];
                    askResponse = event as ChatAppResponse;
                } else if (event["choices"] && event["choices"][0]["delta"]["content"]) {
                    setIsLoading(false);
                    await updateState(event["choices"][0]["delta"]["content"]);
                } else if (event["choices"] && event["choices"][0]["context"]) {
                    // Update context with new keys from latest event
                    askResponse.choices[0].context = { ...askResponse.choices[0].context, ...event["choices"][0]["context"] };
                } else if (event["error"]) {
                    throw Error(event["error"]);
                }
            }
        } finally {
            setIsStreaming(false);
        }
        const fullResponse: ChatAppResponse = {
            ...askResponse,
            choices: [{ ...askResponse.choices[0], message: { content: answer, role: askResponse.choices[0].message.role } }]
        };
        return fullResponse;
    };

    // // 12Sept: commented out this line as it will be replaced for consistency so that useMsal().instance wont need to be called again
    // const client = useLogin ? useMsal().instance : undefined;
    const client = useLogin ? instance : undefined; //technically instance and useMsal().instance is the same
    
    // ----------------------------------- edited code ------------------------------------------
    // adaptive card
    const [showCard, setShowCard] = useState<boolean>(false);

    // keywords
    // const keywords = ["adaptive", "workflow", "card", "uipath"]; //ver: perhaps can add 'adaptive card'
    const keywords = ["#adaptive", "#workflow", "#uipath", "#card", "#adaptive card"]; 
    const containsKeywords = (message: string, keywords: string[]): boolean => {
        const messageLower = message.toLowerCase();
        return keywords.some(keyword => messageLower.includes(keyword));
    };

    // keywords set 2 to trigger diff adaptive cards
    // const keywords2 = ["automation", "integration", "api", "bot"];
    const keywords2 = ["#automation", "#integration", "#api", "#bot"];
    const containsKeywords2 = (message: string, keywords2: string[]): boolean => {
        const messageLower = message.toLowerCase();
        return keywords2.some(keyword => messageLower.includes(keyword));
    };
    // ------------------------------------------------------------------------------------------

    // -------------------------------------- Edited code for SAP CARD Unlock --------------------------------------------------
    // ver 17Oct: Added in codes for unlock SAP card by user keywords <- this may be removed when the template is updated
    const unlockKeywords = ["#unlock sap account", "#unlock account", "#sap unlock"];

    // Function to check if the input contains SAP unlock keywords
    const containsKeywords3 = (message: string, unlockKeywords: string[]): boolean => {
        const messageLower = message.toLowerCase();
        return unlockKeywords.some(keyword => messageLower.includes(keyword));
    };

    // // Function to handle submission of the SAP unlock card
    // const handleUnlockCardSubmit = (data: any) => {
    //     console.log("SAP unlock card submitted with data:", data);
    //     // Process the submitted data (e.g., API call to unlock SAP account)
    //     setShowUnlockCard(false); // Hide the unlock card after submission
    // };

    // -------------------------------------------------------------------------------------------------------------------------

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        // ----------------------------------- edited code ------------------------------------------
        // Check for keywords in the message
        if (containsKeywords(question, keywords)) {
            setShowCard(true);
            setIsLoading(false);
            // setAnswers([...answers, [question, { message: { content: "show adaptive card", role: "system" } } as ChatAppResponse]]);
            setAnswers([...answers, [question, { choices: [{ message: { content: "show adaptive card", role: "system" } }] } as ChatAppResponse]]);
            return;
        } else if 
            (containsKeywords2(question, keywords2)) {
                setShowCard(true);
                setIsLoading(false);
                setAnswers([...answers, [question, { choices: [{ message: { content: "show adaptive card 2", role: "system" } }] } as ChatAppResponse]]);
                return;
        } else {
            setShowCard(false);
        }
        // ------------------------------------------------------------------------------------------
        
        //////////////////////////////////////////// Edit for SAP Card Unlock /////////////////////////////////////////////////////////////////
        // ver: 18 Oct 
        // Function to check if the input contains SAP unlock keywords
        // Check if the message contains SAP unlock keywords using containsKeywords3
        if (containsKeywords3(question, unlockKeywords)) {
            setShowUnlockCard(true);
            setIsLoading(false);
            setAnswers([...answers, [question, { choices: [{ message: { content: "show SAP unlock card", role: "system" } }] } as ChatAppResponse]]);
            return;
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const token = client ? await getToken(client) : undefined;

        try {
            const messages: ResponseMessage[] = answers.flatMap(a => [
                { content: a[0], role: "user" },
                { content: a[1].choices[0].message.content, role: "assistant" }
            ]);

            const request: ChatAppRequest = {
                messages: [...messages, { content: question, role: "user" }],
                stream: shouldStream,
                context: {
                    overrides: {
                        prompt_template: promptTemplate.length === 0 ? undefined : promptTemplate,
                        exclude_category: excludeCategory.length === 0 ? undefined : excludeCategory,
                        top: retrieveCount,
                        temperature: temperature,
                        retrieval_mode: retrievalMode,
                        semantic_ranker: useSemanticRanker,
                        semantic_captions: useSemanticCaptions,
                        suggest_followup_questions: useSuggestFollowupQuestions,
                        use_oid_security_filter: useOidSecurityFilter,
                        use_groups_security_filter: useGroupsSecurityFilter,
                        vector_fields: vectorFieldList,
                        use_gpt4v: useGPT4V,
                        gpt4v_input: gpt4vInput
                    }
                },
                // ChatAppProtocol: Client must pass on any session state received from the server
                // session_state: answers.length ? answers[answers.length - 1][1].choices[0].session_state : null
                session_state: answers.length ? answers[answers.length - 1][1]?.choices[0]?.session_state : null
            };

            const response = await chatApi(request, token);
            if (!response.body) {
                throw Error("No response body");
            }
            if (shouldStream) {
                const parsedResponse: ChatAppResponse = await handleAsyncRequest(question, answers, setAnswers, response.body);
                setAnswers([...answers, [question, parsedResponse]]);
            } else {
                const parsedResponse: ChatAppResponseOrError = await response.json();
                if (response.status > 299 || !response.ok) {
                    throw Error(parsedResponse.error || "Unknown error");
                }
                setAnswers([...answers, [question, parsedResponse as ChatAppResponse]]);
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswers([]);
        setStreamedAnswers([]);
        setIsLoading(false);
        setIsStreaming(false);
    };

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);
    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "auto" }), [streamedAnswers]);
    useEffect(() => {
        getConfig();
    }, []);

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onTemperatureChange = (
        newValue: number,
        range?: [number, number],
        event?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent | React.KeyboardEvent
    ) => {
        setTemperature(newValue);
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onShouldStreamChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setShouldStream(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    const onUseOidSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseOidSecurityFilter(!!checked);
    };

    const onUseGroupsSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseGroupsSecurityFilter(!!checked);
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
    };

    const onShowCitation = (citation: string, index: number) => {
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    return (
        <div className={styles.container}>
            <div className={styles.commandsContainer}>
                <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
                <SettingsButton className={styles.commandButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
            </div>
            <div className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <div className={styles.chatEmptyState}>
                            {/* <SparkleFilled fontSize={"120px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" /> */}
                            <img src={ChatLogo} alt="I AM KAIVA" />
                            {/* <h1 className={styles.chatEmptyStateTitle}>Chat with KAIVA</h1> */}
                            <div style={{ fontSize: "8px", fontWeight: "bold", textAlign: "center", color: "#555" }}>Powered by GPT 4.0</div>
                            <h2 className={styles.chatEmptyStateSubtitle}>Ask KAIVA about IT and Compliance Policies</h2>
                            <ExampleList onExampleClicked={onExampleClicked} useGPT4V={useGPT4V} />

                            {/* updated the below condition {accounts.length === 0 ?  to {username && email ? */}
                            {username && email ? (
                                <div>
                                    <WACR username={username} email={email}/> {/* Renders the Welcome Adaptive Card with user information */}
                                </div>
                            ): null}
                            
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {isStreaming &&
                                streamedAnswers.map((streamedAnswer, index) => (
                                    <div key={index}>
                                        <UserChatMessage message={streamedAnswer[0]} />
                                        <div className={styles.chatMessageGpt}>
                                            <Answer
                                                isStreaming={true}
                                                key={index}
                                                answer={streamedAnswer[1]}
                                                isSelected={false}
                                                onCitationClicked={c => onShowCitation(c, index)}
                                                onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                                onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                                onFollowupQuestionClicked={q => makeApiRequest(q)}
                                                showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
                                            />
                                        </div>
                                    </div>
                                ))}
                            {!isStreaming &&
                                answers.map((answer, index) => (
                                    <div key={index}>
                                        <UserChatMessage message={answer[0]} />
                                        <div className={styles.chatMessageGpt}>
                                            {/* --------------------------- edited code ------------------------------------ */}
                                            {answer[1].choices[0].message.content === "show adaptive card" ? (
                                                    <AdaptiveCardRenderer /> // renders first adaptive card
                                                ) : answer[1].choices[0].message.content === "show adaptive card 2" ? (
                                                    <ACR2 /> // Renders the second adaptive card
                                                ) : answer[1].choices[0].message.content === "show SAP unlock card" ? (
                                                    <SAPUnlockCardRenderer 
                                                    email={email}/> // Renders the second adaptive card
                                                ) : (
                                                <Answer
                                                    isStreaming={false}
                                                    key={index}
                                                    answer={answer[1]}
                                                    isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                                    onCitationClicked={c => onShowCitation(c, index)}
                                                    onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                                    onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                                    onFollowupQuestionClicked={q => makeApiRequest(q)}
                                                    showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {isLoading && (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerLoading />
                                    </div>
                                </>
                            )}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <div className={styles.chatInput}>
                        <QuestionInput
                            clearOnSend
                            placeholder="Type a new question (e.g. what is the minimum password complexity requirement?)"
                            disabled={isLoading}
                            onSend={question => makeApiRequest(question)}
                        />
                    </div>
                </div>


                {answers.length > 0 && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="810px"
                        answer={answers[selectedAnswer][1]}
                        activeTab={activeAnalysisPanelTab}
                    />
                )}

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <TextField
                        className={styles.chatSettingsSeparator}
                        defaultValue={promptTemplate}
                        label="Override prompt template"
                        multiline
                        autoAdjustHeight
                        onChange={onPromptTemplateChange}
                    />

                    <Slider
                        className={styles.chatSettingsSeparator}
                        label="Temperature"
                        min={0}
                        max={1}
                        step={0.1}
                        defaultValue={temperature}
                        onChange={onTemperatureChange}
                        showValue
                        snapToStep
                    />

                    <SpinButton
                        className={styles.chatSettingsSeparator}
                        label="Retrieve this many search results:"
                        min={1}
                        max={50}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />

                    {showSemanticRankerOption && (
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useSemanticRanker}
                            label="Use semantic ranker for retrieval"
                            onChange={onUseSemanticRankerChange}
                        />
                    )}
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSuggestFollowupQuestions}
                        label="Suggest follow-up questions"
                        onChange={onUseSuggestFollowupQuestionsChange}
                    />

                    {showGPT4VOptions && (
                        <GPT4VSettings
                            gpt4vInputs={gpt4vInput}
                            isUseGPT4V={useGPT4V}
                            updateUseGPT4V={useGPT4V => {
                                setUseGPT4V(useGPT4V);
                            }}
                            updateGPT4VInputs={inputs => setGPT4VInput(inputs)}
                        />
                    )}

                    {showVectorOption && (
                        <VectorSettings
                            showImageOptions={useGPT4V && showGPT4VOptions}
                            updateVectorFields={(options: VectorFieldOptions[]) => setVectorFieldList(options)}
                            updateRetrievalMode={(retrievalMode: RetrievalMode) => setRetrievalMode(retrievalMode)}
                        />
                    )}

                    {useLogin && (
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useOidSecurityFilter || requireAccessControl}
                            label="Use oid security filter"
                            disabled={!isLoggedIn(client) || requireAccessControl}
                            onChange={onUseOidSecurityFilterChange}
                        />
                    )}
                    {useLogin && (
                        <Checkbox
                            className={styles.chatSettingsSeparator}
                            checked={useGroupsSecurityFilter || requireAccessControl}
                            label="Use groups security filter"
                            disabled={!isLoggedIn(client) || requireAccessControl}
                            onChange={onUseGroupsSecurityFilterChange}
                        />
                    )}

                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={shouldStream}
                        label="Stream chat completion responses"
                        onChange={onShouldStreamChange}
                    />
                    {useLogin && <TokenClaimsDisplay />}
                </Panel>
            </div>
            <footer className={styles.footer}>
                <div className={styles.disclaimer}>
                    <h6>*KAIVA may display inaccurate info; always validate the resposne</h6>
                </div>
            </footer>

            <div className="chatInput">
                {/* Your existing chat input content goes here */}
                <div className="staticText"> GPT 4.0</div>
            </div>
        </div>
    );
};


// Return block for code version with login button
// return (
//     <div className={styles.container}>
//         <div className={styles.commandsContainer}>
//             <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
//             <SettingsButton className={styles.commandButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
//         </div>
//         <div className={styles.chatRoot}>
//             <div className={styles.chatContainer}>
//                 {!lastQuestionRef.current ? (
//                     <div className={styles.chatEmptyState}>
//                         {/* <SparkleFilled fontSize={"120px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" /> */}
//                         <img src={ChatLogo} alt="I AM KAIVA" />
//                         {/* <h1 className={styles.chatEmptyStateTitle}>Chat with KAIVA</h1> */}
//                         <div style={{ fontSize: "8px", fontWeight: "bold", textAlign: "center", color: "#555" }}>Powered by GPT 4.0</div>
//                         <h2 className={styles.chatEmptyStateSubtitle}>Ask KAIVA about IT and Compliance Policies</h2>
//                         <ExampleList onExampleClicked={onExampleClicked} useGPT4V={useGPT4V} />

//                         {/* ver 12Sep: --- Modification: Added login button when user is not logged in --- */}
//                         {accounts.length === 0 ? (
//                             <button onClick={handleLogin}>Login</button>  // Added login button for when there are no active user accounts
//                             // <p>Redirecting to login...</p> // Display a message indicating redirection to login

//                         ) : (
//                             // --- Modification: Added a welcome message and AdaptiveCardRenderer if the user is logged in ---
//                             <div>
//                                 {/* <h2>Welcome, {username}</h2>  // Displays the username of the logged-in user */}
//                                 <WACR username={username} email={email}/> {/* Renders the Welcome Adaptive Card with user information */}
//                             </div>
//                         )}
                        
//                     </div>
//                 ) : (
//                     <div className={styles.chatMessageStream}>
//                         {isStreaming &&
//                             streamedAnswers.map((streamedAnswer, index) => (
//                                 <div key={index}>
//                                     <UserChatMessage message={streamedAnswer[0]} />
//                                     <div className={styles.chatMessageGpt}>
//                                         <Answer
//                                             isStreaming={true}
//                                             key={index}
//                                             answer={streamedAnswer[1]}
//                                             isSelected={false}
//                                             onCitationClicked={c => onShowCitation(c, index)}
//                                             onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
//                                             onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
//                                             onFollowupQuestionClicked={q => makeApiRequest(q)}
//                                             showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
//                                         />
//                                     </div>
//                                 </div>
//                             ))}
//                         {!isStreaming &&
//                             answers.map((answer, index) => (
//                                 <div key={index}>
//                                     <UserChatMessage message={answer[0]} />
//                                     <div className={styles.chatMessageGpt}>
//                                         {/* --------------------------- edited code ------------------------------------ */}
//                                         {answer[1].choices[0].message.content === "show adaptive card" ? (
//                                                 <AdaptiveCardRenderer /> // renders first adaptive card
//                                             ) : answer[1].choices[0].message.content === "show adaptive card 2" ? (
//                                                 <ACR2 /> // Renders the second adaptive card
//                                             ) : (
//                                             <Answer
//                                                 isStreaming={false}
//                                                 key={index}
//                                                 answer={answer[1]}
//                                                 isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
//                                                 onCitationClicked={c => onShowCitation(c, index)}
//                                                 onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
//                                                 onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
//                                                 onFollowupQuestionClicked={q => makeApiRequest(q)}
//                                                 showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
//                                             />
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         {isLoading && (
//                             <>
//                                 <UserChatMessage message={lastQuestionRef.current} />
//                                 <div className={styles.chatMessageGptMinWidth}>
//                                     <AnswerLoading />
//                                 </div>
//                             </>
//                         )}
//                         {error ? (
//                             <>
//                                 <UserChatMessage message={lastQuestionRef.current} />
//                                 <div className={styles.chatMessageGptMinWidth}>
//                                     <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
//                                 </div>
//                             </>
//                         ) : null}
//                         <div ref={chatMessageStreamEnd} />
//                     </div>
//                 )}

//                 <div className={styles.chatInput}>
//                     <QuestionInput
//                         clearOnSend
//                         placeholder="Type a new question (e.g. what is the minimum password complexity requirement?)"
//                         disabled={isLoading}
//                         onSend={question => makeApiRequest(question)}
//                     />
//                 </div>
//             </div>

//             {answers.length > 0 && activeAnalysisPanelTab && (
//                 <AnalysisPanel
//                     className={styles.chatAnalysisPanel}
//                     activeCitation={activeCitation}
//                     onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
//                     citationHeight="810px"
//                     answer={answers[selectedAnswer][1]}
//                     activeTab={activeAnalysisPanelTab}
//                 />
//             )}

//             <Panel
//                 headerText="Configure answer generation"
//                 isOpen={isConfigPanelOpen}
//                 isBlocking={false}
//                 onDismiss={() => setIsConfigPanelOpen(false)}
//                 closeButtonAriaLabel="Close"
//                 onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
//                 isFooterAtBottom={true}
//             >
//                 <TextField
//                     className={styles.chatSettingsSeparator}
//                     defaultValue={promptTemplate}
//                     label="Override prompt template"
//                     multiline
//                     autoAdjustHeight
//                     onChange={onPromptTemplateChange}
//                 />

//                 <Slider
//                     className={styles.chatSettingsSeparator}
//                     label="Temperature"
//                     min={0}
//                     max={1}
//                     step={0.1}
//                     defaultValue={temperature}
//                     onChange={onTemperatureChange}
//                     showValue
//                     snapToStep
//                 />

//                 <SpinButton
//                     className={styles.chatSettingsSeparator}
//                     label="Retrieve this many search results:"
//                     min={1}
//                     max={50}
//                     defaultValue={retrieveCount.toString()}
//                     onChange={onRetrieveCountChange}
//                 />
//                 <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />

//                 {showSemanticRankerOption && (
//                     <Checkbox
//                         className={styles.chatSettingsSeparator}
//                         checked={useSemanticRanker}
//                         label="Use semantic ranker for retrieval"
//                         onChange={onUseSemanticRankerChange}
//                     />
//                 )}
//                 <Checkbox
//                     className={styles.chatSettingsSeparator}
//                     checked={useSemanticCaptions}
//                     label="Use query-contextual summaries instead of whole documents"
//                     onChange={onUseSemanticCaptionsChange}
//                     disabled={!useSemanticRanker}
//                 />
//                 <Checkbox
//                     className={styles.chatSettingsSeparator}
//                     checked={useSuggestFollowupQuestions}
//                     label="Suggest follow-up questions"
//                     onChange={onUseSuggestFollowupQuestionsChange}
//                 />

//                 {showGPT4VOptions && (
//                     <GPT4VSettings
//                         gpt4vInputs={gpt4vInput}
//                         isUseGPT4V={useGPT4V}
//                         updateUseGPT4V={useGPT4V => {
//                             setUseGPT4V(useGPT4V);
//                         }}
//                         updateGPT4VInputs={inputs => setGPT4VInput(inputs)}
//                     />
//                 )}

//                 {showVectorOption && (
//                     <VectorSettings
//                         showImageOptions={useGPT4V && showGPT4VOptions}
//                         updateVectorFields={(options: VectorFieldOptions[]) => setVectorFieldList(options)}
//                         updateRetrievalMode={(retrievalMode: RetrievalMode) => setRetrievalMode(retrievalMode)}
//                     />
//                 )}

//                 {useLogin && (
//                     <Checkbox
//                         className={styles.chatSettingsSeparator}
//                         checked={useOidSecurityFilter || requireAccessControl}
//                         label="Use oid security filter"
//                         disabled={!isLoggedIn(client) || requireAccessControl}
//                         onChange={onUseOidSecurityFilterChange}
//                     />
//                 )}
//                 {useLogin && (
//                     <Checkbox
//                         className={styles.chatSettingsSeparator}
//                         checked={useGroupsSecurityFilter || requireAccessControl}
//                         label="Use groups security filter"
//                         disabled={!isLoggedIn(client) || requireAccessControl}
//                         onChange={onUseGroupsSecurityFilterChange}
//                     />
//                 )}

//                 <Checkbox
//                     className={styles.chatSettingsSeparator}
//                     checked={shouldStream}
//                     label="Stream chat completion responses"
//                     onChange={onShouldStreamChange}
//                 />
//                 {useLogin && <TokenClaimsDisplay />}
//             </Panel>
//         </div>
//         <footer className={styles.footer}>
//             <div className={styles.disclaimer}>
//                 <h6>*KAIVA may display inaccurate info; always validate the resposne</h6>
//             </div>
//         </footer>

//         <div className="chatInput">
//             {/* Your existing chat input content goes here */}
//             <div className="staticText"> GPT 4.0</div>
//         </div>
//     </div>
// );
// };




export default Chat;
