import requests
from config import GOOGLE_API_KEY, GOOGLE_CSE_ID


def image_search(query):
    """
    Search an image using Google Custom Search API.
    Returns the direct image URL or None.
    """

    url = "https://www.googleapis.com/customsearch/v1"

    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CSE_ID,
        "q": query,
        "searchType": "image",
        "num": 1,
        "safe": "active"
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        print("========== IMAGE API ==========")
        print(data)
        print("===============================")

        items = data.get("items")

        if items:
            image_url = items[0].get("link")
            print("IMAGE URL:", image_url)
            return image_url

        print("No image found.")
        return None

    except requests.exceptions.RequestException as e:
        print("Google Image API Error:", e)
        return None

    except Exception as e:
        print("Image Search Error:", e)
        return None