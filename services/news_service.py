import requests

NEWS_API_KEY = "YOUR_NEWSDATA_API_KEY"


def get_current_news():

    url = (
        "https://newsdata.io/api/1/latest"
        f"?country=in&apikey={NEWS_API_KEY}"
    )

    try:

        response = requests.get(url)
        data = response.json()

        articles = data.get("results", [])[:5]

        if not articles:
            return "No news found."

        news = []

        for i, article in enumerate(articles, start=1):
            title = article.get("title", "No title")
            news.append(f"{i}. {title}")

        return "Top Headlines:\n\n" + "\n\n".join(news)

    except Exception as e:
        return f"Unable to fetch news. {e}"