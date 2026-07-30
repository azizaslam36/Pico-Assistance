import os
import webbrowser

def execute_command(query):
    query = query.lower()
    # Greetings
    if query in ["hi","hello","hey","good morning","good afternoon","good evening"]:
        return {"response": "Hello! I'm Pico. How can I help you today?"}

    if query in ["thanks","thank you","ok thanks"]:
        return {"response": "You're welcome! Happy to help."}

    if "how are you" in query:
        return {"response": "I'm doing great! How can I help you?"}

    if "who are you" in query:
        return {"response": "I am Pico, your AI assistant."}

    # Websites
    if "open youtube" in query:
        webbrowser.open("https://youtube.com")
        return {"response": "Opening YouTube."}

    if "open google" in query:
        webbrowser.open("https://google.com")
        return {"response": "Opening Google."}

    # Apps
    if "open notepad" in query:
        os.system("notepad")
        return {"response": "Opening Notepad."}

    if "open vs code" in query:
        os.system("code")
        return {"response": "Opening VS Code."}

    return None