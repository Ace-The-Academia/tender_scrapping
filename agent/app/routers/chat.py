"""
The chat endpoint.

This is what the front-end or any client calls to talk to the agent.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..agent import run_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


# ---------- Request / response models ----------
class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = Field(
        None,
        description="Optional. Identifies a conversation. Used for memory.",
    )
    history: Optional[list[ChatMessage]] = Field(
        None,
        description="Optional. Prior messages in the conversation.",
    )


class ChatResponse(BaseModel):
    response: str
    tools_used: list[str]
    session_id: Optional[str] = None


# ---------- Endpoints ----------
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to the agent and get a response.

    Example:
        POST /agent/chat
        {
          "message": "Find IT tenders in the Western Cape",
          "session_id": "user-123"
        }

    The agent will:
      1. Think about what to do
      2. Call tools (search, details, analyze, match) as needed
      3. Return a natural-language answer

    The response includes:
      - response: the agent's final answer
      - tools_used: which tools it called
    """
    logger.info("Chat request: %s...", request.message[:100])

    # Convert prior messages to LangChain format if provided
    chat_history = []
    if request.history:
        from langchain_core.messages import HumanMessage, AIMessage
        for msg in request.history:
            if msg.role == "user":
                chat_history.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                chat_history.append(AIMessage(content=msg.content))

    result = await run_agent(request.message, chat_history)

    return ChatResponse(
        response=result["output"],
        tools_used=result["tools_used"],
        session_id=request.session_id,
    )


@router.get("/health")
async def health() -> dict:
    """Quick liveness probe for the agent service."""
    from ..llm import is_azure_available

    azure_ok = await is_azure_available()
    return {
        "status": "ok" if azure_ok else "degraded",
        "azure": "ok" if azure_ok else "unavailable",
    }