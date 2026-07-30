import requests


def duckduckgo_search(query):

    url = (
        "https://api.duckduckgo.com/"
        f"?q={query}"
        "&format=json"
        "&no_html=1"
        "&skip_disambig=1"
    )

    try:

        response = requests.get(url).json()

        abstract = response.get("AbstractText")

        if abstract:
            return abstract

        return None

    except Exception as e:

        print("DuckDuckGo Error:", e)

        return None