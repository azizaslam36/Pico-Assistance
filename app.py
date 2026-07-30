print("App Started")
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

from services.commands import execute_command
from services.google_service import google_search
from services.duckduckgo import duckduckgo_search
from services.wiki_service import wikipedia_summary
from services.weather_service import get_weather
from services.news_service import get_current_news
from google import genai
from services.image_service import image_search


app = Flask(__name__)
CORS(app)

# Follow-up Context Memory
last_topic = None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/command", methods=["POST"])
def process_command():
    global last_topic

    data = request.json
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"response": "I didn't catch that. Please try again."})

    query_lower = query.lower()

    # ----------------------------
    # Local Commands
    # ----------------------------
    command = execute_command(query)
    if command:
        return jsonify(command)
    
    # ----------------------------
    # Weather
    # ----------------------------
    if "weather in" in query_lower:
        city = query_lower.replace("pico", "")
        city = city.replace("weather in", "").strip()
        weather = get_weather(city)

        if weather:
            return jsonify({"response": weather})

        return jsonify({
            "response": "Sorry, I couldn't fetch the weather."
        })

    # ----------------------------
    # News
    # ----------------------------

    if "news" in query_lower:
        return jsonify({
            "response": get_current_news()
        })

    # ----------------------------
    # Image Detection
    # ----------------------------

    image_keywords = ["image", "picture","photo","show me","display"]

    needs_image = any(
        keyword in query_lower
        for keyword in image_keywords)

    # ----------------------------
    # Follow-up Memory
    # ----------------------------

    if query_lower in [
        "he",
        "she",
        "it",
        "they",
        "who is he",
        "who is she"
    ]:

        if last_topic:
            query = last_topic
        else:
            return jsonify({
                "response": "Could you clarify who you are asking about?"
            })

    # ----------------------------
    # Google Search
    # ----------------------------
    
    text = google_search(query)
    image = None

    if needs_image:
        image = image_search(query)

        if image:
            last_topic = query
            return jsonify({
                "response": f"Here is the image of {query}.",
                "image":image
            })

    if text:
        last_topic = query

    response = {
        "response": text
    }

    if image:
        response["image"] = image

        return jsonify(response)

    # ----------------------------
    # DuckDuckGo
    # ----------------------------

    duck_result = duckduckgo_search(query)

    if duck_result:

        last_topic = query

        return jsonify({
            "response": duck_result
        })

    # ----------------------------
    # Wikipedia
    # ----------------------------

    wiki_result = wikipedia_summary(query)

    if wiki_result:

        last_topic = query

        return jsonify({
            "response": wiki_result
        })

    # ----------------------------
    # Nothing Found
    # ----------------------------

    return jsonify({
        "response": "Sorry, I couldn't find any information on that."
    })

print("Reached Bottom")
if __name__ == "__main__":
    app.run(debug=True)