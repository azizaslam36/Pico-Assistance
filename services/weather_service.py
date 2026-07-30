import requests

from config import WEATHER_API_KEY


def get_weather(city):

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}"
        f"&appid={WEATHER_API_KEY}"
        "&units=metric"
    )

    try:

        response = requests.get(url).json()

        if response.get("cod") != 200:
            return None

        return (
            f"🌡 Temperature : {response['main']['temp']}°C\n"
            f"💧 Humidity : {response['main']['humidity']}%\n"
            f"🌬 Wind Speed : {response['wind']['speed']} m/s"
        )

    except Exception as e:

        print("Weather Error:", e)

        return None