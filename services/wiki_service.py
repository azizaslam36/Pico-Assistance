import requests


def wikipedia_summary(topic):

    url = (
        "https://en.wikipedia.org/api/rest_v1/page/summary/"
        + topic.replace(" ", "_")
    )

    try:

        response = requests.get(url).json()

        summary = response.get("extract")

        if summary:
            return summary

        return None

    except Exception as e:

        print("Wikipedia Error:", e)

        return None