from flask import Flask, render_template, request, jsonify
import os
import webbrowser
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- GOOGLE CUSTOM SEARCH CONFIG ---
GOOGLE_API_KEY = "AIzaSyBFdz94jaAq9sDSzmSv5_u9h37yrYjJ_a8"
GOOGLE_CSE_ID = "45e91f456e2d84afe"
GOOGLE_QUERY_COUNT = 0
GOOGLE_QUERY_LIMIT = 50  # limit Google queries per day

# --- Follow-up context memory ---
last_topic = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/command', methods=['POST'])
def process_command():
    global last_topic
    data = request.json
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"response": "I didn't catch that. Please try again."})

    query_lower = query.lower()

    # --- Self-introduction ---
    if "pico who are you" in query_lower or "tell me about yourself" in query_lower or "who are you" in query_lower:
        return jsonify({"response": "I am Pico, a virtual assistant created by Mohd Aziz Aslam, Lalit, and Raghav using HTML, CSS, JavaScript, and Python. I can perform various tasks for you."})

    # --- Open Websites ---
    elif "pico open youtube" in query_lower:
        webbrowser.open("https://www.youtube.com")
        return jsonify({"response": "Opening YouTube."})
    elif "pico open google" in query_lower:
        webbrowser.open("https://www.google.com")
        return jsonify({"response": "Opening Google."})

    # --- Open Local Applications ---
    elif "pico open notepad" in query_lower:
        os.system("notepad.exe")
        return jsonify({"response": "Opening Notepad."})
    elif "pico open vs code" in query_lower:
        os.system("code")
        return jsonify({"response": "Opening VS Code."})

    # --- Weather Info ---
    elif "pico weather in" in query_lower:
        city = query_lower.replace("weather in", "").strip()
        api_key = "YOUR_OPENWEATHERMAP_API_KEY"
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        try:
            response = requests.get(url).json()
            if response.get("cod") == 200:
                temp = response["main"]["temp"]
                hum = response["main"]["humidity"]
                wind = response["wind"]["speed"]
                weather_info = f"Temperature: {temp}°C, Humidity: {hum}%, Wind Speed: {wind} m/s"
                return jsonify({"response": weather_info})
            else:
                return jsonify({"response": "Sorry, I couldn't fetch the weather for that location."})
        except Exception as e:
            return jsonify({"response": f"An error occurred: {e}"})

    # --- News ---
    elif "news" in query_lower:
        return jsonify({"response": get_current_news()})

    # --- Exit ---
    elif "exit" in query_lower:
        return jsonify({"response": "Bye Bye, have a nice day!"})

    # --- Google Custom Search + fallback ---
    else:
        # Follow-up context replacement
        if query_lower in ["he", "she", "it", "they", "who is he", "who is she"]:
            if last_topic:
                query = last_topic
            else:
                return jsonify({"response": "Could you clarify who you are asking about?"})

        # Try Google Image Search first
        snippet, image_url = google_cse_search(query)
        if snippet:
            last_topic = query
            return jsonify({"response": snippet, "image": image_url, "fromGoogle": True})

        # DuckDuckGo fallback
        duck_result = duckduckgo_search(query)
        if duck_result:
            last_topic = query
            return jsonify({"response": duck_result})

        # Wikipedia fallback
        wiki_result = wikipedia_summary(query)
        if wiki_result:
            last_topic = query
            return jsonify({"response": wiki_result})

        return jsonify({"response": "Sorry, I couldn't find any information on that."})


# --- GOOGLE CUSTOM SEARCH FUNCTION ---
def google_cse_search(query):
    global GOOGLE_QUERY_COUNT
    if GOOGLE_QUERY_COUNT >= GOOGLE_QUERY_LIMIT:
        return None, None  # limit reached

    url = f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_API_KEY}&cx={GOOGLE_CSE_ID}&q={query}&searchType=image"
    try:
        response = requests.get(url).json()
        GOOGLE_QUERY_COUNT += 1

        if "items" in response:
            snippet = response["items"][0].get("title")  # Text to read
            image_url = response["items"][0].get("link") # Image URL
            return snippet, image_url

        return None, None
    except Exception as e:
        print("Google search error:", e)
        return None, None


# --- DUCKDUCKGO INSTANT ANSWER FUNCTION ---
def duckduckgo_search(query):
    try:
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
        response = requests.get(url).json()
        abstract = response.get("AbstractText")
        if abstract:
            return abstract
        return None
    except:
        return None

# --- WIKIPEDIA REST API FUNCTION ---
def wikipedia_summary(topic):
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic.replace(' ', '_')}"
        response = requests.get(url).json()
        summary = response.get("extract")
        if summary:
            return summary
        return None
    except:
        return None

# --- NEWS FUNCTION ---
def get_current_news():
    api_key = "pub_6a031bc4533a4deb9b286fca85a3d354"
    url = f"https://newsdata.io/api/1/latest?country=in&apikey={api_key}"
    try:
        response = requests.get(url).json()
        articles = response.get("results", [])[:3]
        if not articles:
            return "No news found."
        news_text = "\n\n".join([f"{i+1}. {a.get('title','No title')}" for i, a in enumerate(articles)])
        return "Here are the top news headlines:\n\n" + news_text
    except Exception as e:
        return f"Sorry, I could not fetch the news. ({str(e)})"


if __name__ == "__main__":
    app.run(debug=True)
