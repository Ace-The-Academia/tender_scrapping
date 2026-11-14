"""
Tool: find_matching_tenders

Fetches open tenders and scores each one against a business profile.
"""
import logging

import httpx
from langchain_core.tools import tool

from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@tool
async def find_matching_tenders(profile_id: int | str, limit: int = 5) -> str:
    """
    Find the tenders that best match a business profile.

    Fetches open tenders from the database, scores each one against
    the profile using the AI service, and returns the top matches
    with a suitability score.

    Use this tool when the user asks "which tenders suit my business?"
    or after uploading a business profile PDF.

    Args:
        profile_id: The business profile id (integer) returned from
                    upload_business_profile. Must be a real number.
        limit: How many top matches to return. Default 5, max 10.

    Returns:
        A short plain-text list of the top matching tenders.
    """
    # --- Validate profile_id ---
    if profile_id is None or profile_id == "" or str(profile_id).lower() in ("none", "null"):
        return (
            "TOOL_ERROR: No valid profile_id provided. "
            "You must first call upload_business_profile and use the id it returned. "
            "Do NOT call this tool again without a valid profile_id."
        )

    try:
        profile_id = int(profile_id)
    except (ValueError, TypeError):
        return (
            f"TOOL_ERROR: Invalid profile_id '{profile_id}'. "
            "Only use a numeric id from upload_business_profile."
        )

    if profile_id <= 0:
        return (
            f"TOOL_ERROR: Invalid profile_id {profile_id}. "
            "Profile ids are positive numbers. Use the id from upload_business_profile."
        )

    limit = min(int(limit), 10)

    try:
        async with httpx.AsyncClient(timeout=900) as client:
            # 1. Fetch open tenders
            tenders_resp = await client.get(
                f"{settings.client_api_url}/tenders",
                params={"status": "Open", "limit": 20},
            )
            tenders_resp.raise_for_status()
            tenders = tenders_resp.json().get("tenders", [])

            if not tenders:
                return "No open tenders found."

            # 2. For each tender: create it in AI service + score it
            matches = []
            for t in tenders[:15]:
                tn = t.get("tender_number")
                try:
                    create_resp = await client.post(
                        f"{settings.ai_service_url}/api/tenders",
                        json={
                            "title": t.get("title", "Untitled"),
                            "organisation": t.get("organisation_name"),
                            "description": t.get("description") or t.get("title", ""),
                            "source_url": t.get("tender_url"),
                            "closing_date": str(t.get("closing_date")) if t.get("closing_date") else None,
                        },
                    )
                    create_resp.raise_for_status()
                    tender_id = create_resp.json()["id"]

                    match_resp = await client.post(
                        f"{settings.ai_service_url}/api/tenders/{tender_id}/match/{profile_id}"
                    )
                    if match_resp.status_code == 404:
                        logger.warning("Profile %s not found — aborting.", profile_id)
                        return (
                            f"TOOL_ERROR: The profile_id {profile_id} was not found in the AI service. "
                            "Tell the user the profile could not be found and to try uploading it again."
                        )
                    match_resp.raise_for_status()
                    m = match_resp.json()

                    matches.append({
                        "tender_number": tn,
                        "title": t.get("title"),
                        "organisation": t.get("organisation_name"),
                        "score": m.get("suitability_score"),
                        "recommendation": (m.get("recommendation") or "")[:200],
                    })
                except Exception as e:
                    logger.warning("Failed to score %s: %s", tn, e)
                    continue

    except Exception as e:
        logger.error("find_matching_tenders failed: %s", e)
        return (
            "TOOL_ERROR: Could not match tenders right now. "
            "Tell the user to try again in a moment. "
            "Do NOT invent URLs or explanations."
        )

    if not matches:
        return (
            "TOOL_ERROR: Could not score any tenders. "
            "Tell the user the matching service is temporarily unavailable and to try again."
        )

    matches.sort(key=lambda x: x.get("score") or 0, reverse=True)
    top = matches[:limit]

    lines = [f"Top {len(top)} matches (out of {len(matches)} scored):"]
    for m in top:
        lines.append(
            f"- [{m['tender_number']}] score {m['score']}/100 — {m['title']} | {m['organisation']}"
        )

    lines.append("")
    lines.append("Now write your final answer to the user with these top matches. Do NOT call any more tools.")

    return "\n".join(lines)