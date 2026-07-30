import re
from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)


def clean_text(text):
    """Remove markdown symbols from Gemini response."""

    if not text:
        return ""

    # Remove markdown formatting
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"#{1,6}\s*", "", text)
    text = re.sub(r"`+", "", text)
    text = re.sub(r"---+", "", text)

    # Remove extra blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def google_search(query):
    try:

        prompt = f"""
You are Pico, a smart AI assistant.

Rules:
- Reply naturally.
- Do NOT use markdown.
- Do NOT use headings.
- Do NOT use ** or ###.
- Speak like ChatGPT.
- Be conversational.
- Never introduce yourself unless the user asks who you are.
- Never start with "Hello", "Hi", or "I am Pico".
- Answer directly.
- Keep answers between 40 and 80 words.
- Only give long explanations if the user asks for detailed information.

User:
{query}
"""

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        print("========== GEMINI RESPONSE ==========")
        print(response.text)
        print("=====================================")

        text = clean_text(response.text)

        return text

    except Exception as e:
        print("Gemini Error:", e)
        return None