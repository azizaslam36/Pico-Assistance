from tokenize import Ignore
from flask import Flask, render_template, request, jsonify
import os
import webbrowser
import requests
import wikipedia
from wikipedia.exceptions import DisambiguationError, PageError
from flask_cors import CORS  

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/command', methods=['POST'])
def process_command():
    data = request.json
    query = data.get("query", "").lower()

    if not query:
        return jsonify({"response": "I didn't catch that. Please try again."})

    # Self-introduction
    elif "who are you" in query or "tell me about yourself" in query:
        return jsonify({"response": "I am Pico, a virtual assistant created by Aziz, Lalit, and Raghav using HTML, CSS, JavaScript, and Python. I can perform various tasks for you."})

    # Open Websites
    elif "open youtube" in query:
        webbrowser.open("https://www.youtube.com")
        return jsonify({"response": "Opening YouTube."})

    elif "open google" in query:
        webbrowser.open("https://www.google.com")
        return jsonify({"response": "Opening Google."})

    # Open Local Applications
    elif "open notepad" in query:
        os.system("notepad.exe")
        return jsonify({"response": "Opening Notepad."})

    elif "open vs code" in query:
        os.system("code")
        return jsonify({"response": "Opening VS Code."})

    # Weather Info
    elif "weather in" in query:
        city = query.replace("weather in", "").strip()
        api_key = "YOUR_OPENWEATHERMAP_API_KEY"  # Replace with your actual API key
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        try:
            response = requests.get(url)
            data = response.json()
            if data["cod"] == 200:
                temperature = data["main"]["temp"]
                humidity = data["main"]["humidity"]
                wind_speed = data["wind"]["speed"]
                weather_info = f"Temperature: {temperature}°C, Humidity: {humidity}%, Wind Speed: {wind_speed} m/s"
                return jsonify({"response": weather_info})
            else:
                return jsonify({"response": "Sorry, I couldn't fetch the weather for that location."})
        except Exception as e:
            return jsonify({"response": f"An error occurred: {e}"})

    # Wikipedia Search with Image
    elif any(x in query for x in ["wikipedia", "search wikipedia for", "who is", "what is", "where is", "how", "tell me"]):
        prefixes = ["search wikipedia for", "who is", "what is", "where is", "how", "tell me", "wikipedia"]
        for prefix in prefixes:
            if query.startswith(prefix):
                query = query.replace(prefix, "").strip()

        try:
            page = wikipedia.page(query)
            summary = page.summary[:500]
            image_url = page.images[0] if page.images else None
            return jsonify({
                "response": summary,
                "image": image_url
            })
        except DisambiguationError:
            return jsonify({"response": "There are multiple results. Please be more specific.", "image": None})
        except PageError:
            return jsonify({"response": "Sorry, I couldn't find any info on that topic.", "image": None})
        except Exception:
            return jsonify({"response": "An error occurred while searching Wikipedia.", "image": None})

    # News Headlines
    elif "news" in query:
        return jsonify(get_current_news())

    # Exit
    elif "exit" in query:
        return jsonify({"response": "Bye Bye, have a nice day!"})

    return jsonify({"response": "I didn't understand that command."})

# News API Function
def get_current_news():
    api_key = "pub_6a031bc4533a4deb9b286fca85a3d354"
    url = f"https://newsdata.io/api/1/latest?country=in&apikey={api_key}"
    try:
        response = requests.get(url).json()
        articles = response.get("results", [])[:3]
        if not articles:
            return {"text": "No news found.", "image": None}

        news_text = "\n\n".join([f"{i+1}. {a.get('title','No title')}" for i, a in enumerate(articles)])
        return {"text": "Here are the top news headlines:\n\n" + news_text, "image": None}

    except Exception as e:
        return {"text": f"Sorry, I could not fetch the news. ({str(e)})", "image": None}
        
if __name__ == "__main__":
    app.run(debug=True)
