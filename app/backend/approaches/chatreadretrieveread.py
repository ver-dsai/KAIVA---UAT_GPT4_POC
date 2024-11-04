from typing import Any, Coroutine, List, Literal, Optional, Union, overload

from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorQuery
from openai import AsyncOpenAI, AsyncStream
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionToolParam,
)

from approaches.approach import ThoughtStep
from approaches.chatapproach import ChatApproach
from core.authentication import AuthenticationHelper
from core.modelhelper import get_token_limit


class ChatReadRetrieveReadApproach(ChatApproach):
    """
    A multi-step approach that first uses OpenAI to turn the user's question into a search query,
    then uses Azure AI Search to retrieve relevant documents, and then sends the conversation history,
    original user question, and search results to OpenAI to generate a response.
    """

    def __init__(
        self,
        *,
        search_client: SearchClient,
        auth_helper: AuthenticationHelper,
        openai_client: AsyncOpenAI,
        chatgpt_model: str,
        chatgpt_deployment: Optional[str],  # Not needed for non-Azure OpenAI
        embedding_deployment: Optional[str],  # Not needed for non-Azure OpenAI or for retrieval_mode="text"
        embedding_model: str,
        sourcepage_field: str,
        content_field: str,
        query_language: str,
        query_speller: str,
    ):
        self.search_client = search_client
        self.openai_client = openai_client
        self.auth_helper = auth_helper
        self.chatgpt_model = chatgpt_model
        self.chatgpt_deployment = chatgpt_deployment
        self.embedding_deployment = embedding_deployment
        self.embedding_model = embedding_model
        self.sourcepage_field = sourcepage_field
        self.content_field = content_field
        self.query_language = query_language
        self.query_speller = query_speller
        self.chatgpt_token_limit = get_token_limit(chatgpt_model)

    @property
    def system_message_chat_conversation(self):
        return """Assistant helps company employees with their IT policy-related questions. Be brief in your answers.
        Answer ONLY with the facts listed in the 20 IT policy documents below. If there isn't enough information, say you don't know. Do not generate answers that don't use the sources below. If asking a clarifying question to the user would help, ask the question.
        
        For questions related to "SAP login issues" or "SAP account lock" (including variations like "unable to log into SAP" or "SAP account disabled"), respond with the following information: 
        "To prevent unauthorized access to SAP Systems, user accounts are disabled after 90 days of inactivity. 
        
        Activating your disabled account can be done directly here in KAIVA in 3 easy steps!

        Here is how to do it:
        1. Type the keyword '#sap unlock' or '#unlock sap account' into the chat. This will display the SAP account unlock request form.
        2. Fill in your selections for your desired SAP System Environment and SAP System type in the SAP account unlock request form.
        3. Submit the request form. You will receive the request outcome response shortly."

        For tabular information return it as an html table. Do not return markdown format. If the question is not in English, answer in the language used in the question.
        Each source has a name followed by a colon and the actual information. Always include the source name for each fact you use in the response. Use square brackets to reference the source, for example [info1.txt]. Don't combine sources, list each source separately, for example [info1.txt][info2.pdf].

        Example:
        Q: What are the complexity requirements for the new password??
        A: To provide you with the most up-to-date password complexity requirements, please refer to the latest [document_name]. Ensure to check the following sections for detailed guidelines:
            - Minimum password length
            - Character requirements (uppercase, lowercase, numbers, symbols)
            - Any additional security measures or considerations

        Guidance:
        - Clearly define the scope of the available information.
        - Provide specific examples to guide the model's understanding.
        - Organize information in a structured manner and emphasize the importance of format.
        - Encourage the model to ask clarifying questions when needed.
        - Alway answer in bullet pointers.

        If the model is confused or has doubts due to multiple possible answers, it should ask the user to narrow down the question by presenting the options. For instance:
        Q: What specific information are you looking for regarding the employee handbook or IT policies? Please choose from the following options:
        1. Handbook policies
        2. IT policy details
        3. Other (please specify) [user_input].

        {follow_up_questions_prompt}
        {injected_prompt}

        """
           


    # @property
    # def system_message_chat_conversation(self):
    #     return """Assistant helps company employees with their IT policy-related questions. Be brief in your answers.
    #     Answer ONLY with the facts listed in the documents uploaded. If there isn't enough information, say you don't know. Do not generate answers that don't use the sources below. If asking a clarifying question to the user would help, ask the question.
    #     For tabular information return it as an html table. Do not return markdown format. If the question is not in English, answer in the language used in the question.
    #     Each source has a name followed by a colon and the actual information. Always include the source name for each fact you use in the response. Use square brackets to reference the source, for example [info1.txt]. Don't combine sources, list each source separately, for example [info1.txt][info2.pdf].

    #     Example:
    #     Q: What are the complexity requirements for the new password??
    #     A: To provide you with the most up-to-date password complexity requirements, please refer to the latest [document_name]. Ensure to check the following sections for detailed guidelines:
    #         - Minimum password length
    #         - Character requirements (uppercase, lowercase, numbers, symbols)
    #         - Any additional security measures or considerations

    #     Guidance:
    #     - Clearly define the scope of the available information.
    #     - Provide specific examples to guide the model's understanding.
    #     - Organize information in a structured manner and emphasize the importance of format.
    #     - Encourage the model to ask clarifying questions when needed.
    #     - Alway answer in bullet pointers.

    #     If the model is confused or has doubts due to multiple possible answers, it should ask the user to narrow down the question by presenting the options. For instance:
    #     Q: What specific information are you looking for regarding the employee handbook or IT policies? Please choose from the following options:
    #     1. Handbook policies
    #     2. IT policy details
    #     3. Other (please specify) [user_input].

    #     Here's the additional prompt for handling defects from the PDF:
        
    
    #     All Ship Defect PDF_corrected v3 Prompt:
    #     You have a PDF document containing a list of defects for various ships. Each defect is associated with specific information such as the defect number, status, vessel name, opening date, description of the defect, etc.

    #     Your task is to develop a system that can accurately retrieve and present information about defects based on user queries. The system should be able to handle various types of queries, such as:

    #     1. Listing all defects with a specific status (e.g., "Cancelled", "Closed", etc.).
    #     2. Providing detailed information about a specific defect number.
    #     3. Filtering defects based on different criteria (e.g., vessel name, opening date, priority, etc.).
    #     4. Presenting a complete list of defects based on the user's request.

    #     When a user asks a question or makes a query, the system should provide a comprehensive and accurate response, including all relevant information for the requested defects. For example:

    #     - If a user asks, "List down defect numbers of all defects with status as 'Cancelled'", the system should return the complete list of defect numbers for all defects with the status "Cancelled".
    #     - If a user requests information about a specific defect number, the system should provide all available details about that particular defect.

    #     Please design the prompt and system logic to ensure that it can effectively handle these types of queries and provide accurate responses based on the information in the PDF document.
        
    #     {follow_up_questions_prompt}
    #     {injected_prompt}
        
    #     """



    @overload
    async def run_until_final_call(
        self,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: Literal[False],
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, ChatCompletion]]: ...

    @overload
    async def run_until_final_call(
        self,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: Literal[True],
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, AsyncStream[ChatCompletionChunk]]]: ...

    async def run_until_final_call(
        self,
        history: list[dict[str, str]],
        overrides: dict[str, Any],
        auth_claims: dict[str, Any],
        should_stream: bool = False,
    ) -> tuple[dict[str, Any], Coroutine[Any, Any, Union[ChatCompletion, AsyncStream[ChatCompletionChunk]]]]:
        has_text = overrides.get("retrieval_mode") in ["text", "hybrid", None]
        has_vector = overrides.get("retrieval_mode") in ["vectors", "hybrid", None]
        use_semantic_captions = True if overrides.get("semantic_captions") and has_text else False
        top = overrides.get("top", 3)
        filter = self.build_filter(overrides, auth_claims)
        use_semantic_ranker = True if overrides.get("semantic_ranker") and has_text else False

        original_user_query = history[-1]["content"]
        user_query_request = "Generate search query for: " + original_user_query

        tools: List[ChatCompletionToolParam] = [
            {
                "type": "function",
                "function": {
                    "name": "search_sources",
                    "description": "Retrieve sources from the Azure AI Search index",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "search_query": {
                                "type": "string",
                                "description": "Query string to retrieve documents from azure search eg: 'Health care plan'",
                            }
                        },
                        "required": ["search_query"],
                    },
                },
            }
        ]

        # STEP 1: Generate an optimized keyword search query based on the chat history and the last question
        messages = self.get_messages_from_history(
            system_prompt=self.query_prompt_template,
            model_id=self.chatgpt_model,
            history=history,
            user_content=user_query_request,
            max_tokens=self.chatgpt_token_limit - len(user_query_request),
            few_shots=self.query_prompt_few_shots,
        )

        chat_completion: ChatCompletion = await self.openai_client.chat.completions.create(
            messages=messages,  # type: ignore
            # Azure Open AI takes the deployment name as the model name
            model=self.chatgpt_deployment if self.chatgpt_deployment else self.chatgpt_model,
            temperature=0.0,  # Minimize creativity for search query generation
            max_tokens=100,  # Setting too low risks malformed JSON, setting too high may affect performance
            n=1,
            tools=tools,
            tool_choice="auto",
        )

        query_text = self.get_search_query(chat_completion, original_user_query)

        # STEP 2: Retrieve relevant documents from the search index with the GPT optimized query

        # If retrieval mode includes vectors, compute an embedding for the query
        vectors: list[VectorQuery] = []
        if has_vector:
            vectors.append(await self.compute_text_embedding(query_text))

        # Only keep the text query if the retrieval mode uses text, otherwise drop it
        if not has_text:
            query_text = None

        results = await self.search(top, query_text, filter, vectors, use_semantic_ranker, use_semantic_captions)

        sources_content = self.get_sources_content(results, use_semantic_captions, use_image_citation=False)
        content = "\n".join(sources_content)

        # STEP 3: Generate a contextual and content specific answer using the search results and chat history

        # Allow client to replace the entire prompt, or to inject into the exiting prompt using >>>
        system_message = self.get_system_prompt(
            overrides.get("prompt_template"),
            self.follow_up_questions_prompt_content if overrides.get("suggest_followup_questions") else "",
        )

        response_token_limit = 1024
        messages_token_limit = self.chatgpt_token_limit - response_token_limit
        messages = self.get_messages_from_history(
            system_prompt=system_message,
            model_id=self.chatgpt_model,
            history=history,
            # Model does not handle lengthy system messages well. Moving sources to latest user conversation to solve follow up questions prompt.
            user_content=original_user_query + "\n\nSources:\n" + content,
            max_tokens=messages_token_limit,
        )

        data_points = {"text": sources_content}

        extra_info = {
            "data_points": data_points,
            "thoughts": [
                ThoughtStep(
                    "Original user query",
                    original_user_query,
                ),
                ThoughtStep(
                    "Generated search query",
                    query_text,
                    {"use_semantic_captions": use_semantic_captions, "has_vector": has_vector},
                ),
                ThoughtStep("Results", [result.serialize_for_results() for result in results]),
                ThoughtStep("Prompt", [str(message) for message in messages]),
            ],
        }

        chat_coroutine = self.openai_client.chat.completions.create(
            # Azure Open AI takes the deployment name as the model name
            model=self.chatgpt_deployment if self.chatgpt_deployment else self.chatgpt_model,
            messages=messages,
            temperature=overrides.get("temperature", 0.3),
            max_tokens=response_token_limit,
            n=1,
            stream=should_stream,
        )
        return (extra_info, chat_coroutine)
