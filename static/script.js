let isListening = false;
let voices = [];
let isSpeaking = false;
let speakingAnimation = false;


const micButton = document.getElementById("mic-button");
const actionButton = document.getElementById("action-button");
const chatWindow = document.getElementById("chat-window");
const canvas = document.getElementById("waveformCanvas");
const ctx = canvas.getContext("2d");

// Speech Recognition setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

// Load voices
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) setTimeout(loadVoices, 500);
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Speak function
function speak(text, callback = null) {
    if (voices.length === 0) { setTimeout(() => speak(text, callback), 500); return; }

    let speech = new SpeechSynthesisUtterance(text);
    let femaleVoice = voices.find(v => v.name.toLowerCase().includes("female")) || voices[0];
    speech.voice = femaleVoice;

    isSpeaking = true;
    speakingAnimation = true;  // Start speaking waveform animation

    speech.onend = () => {
        isSpeaking = false;
        speakingAnimation = false; // Stop animation when done
        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}


// Chat message function
function addMessage(text, sender, imageUrl = null) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.innerText = text;
    message.appendChild(bubble);
    if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        message.appendChild(img);
    }
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Start listening
function startListening() {
    actionButton.disabled = true;
    addMessage("Hi, Pico here. How can I help you?", "pico");
    speak("Hi, Pico here. How can I help you?", () => {
        recognition.start();
        isListening = true;
        actionButton.innerText = "Stop Listening";
        actionButton.disabled = false;
        micButton.classList.add("active");
    });
}

// Action button click
actionButton.addEventListener("click", () => {
    window.speechSynthesis.resume();
    if (isSpeaking) return;
    if (isListening) {
        recognition.stop();
        isListening = false;
        actionButton.innerText = "Start Listening";
        micButton.classList.remove("active");
    } else startListening();
});

// Mic button click
micButton.addEventListener("click", () => {
    if (micButton.classList.contains("active")) {
        recognition.stop();
        micButton.classList.remove("active");
    } else {
        recognition.start();
        micButton.classList.add("active");
    }
});

// Handle voice input
recognition.onresult = (event) => {
    const command = event.results[0][0].transcript;
    addMessage(command, "user");
    sendCommand(command);
};

recognition.onend = () => { isListening = false; micButton.classList.remove("active"); };

// Send command to Flask
function sendCommand(command) {
    fetch("/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: command })
    })
    .then(res => res.json())
    .then(data => {
        addMessage(data.response, "pico", data.image);
        speak(data.response, () => {
            recognition.start();
            isListening = true;
            actionButton.innerText = "Stop Listening";
            micButton.classList.add("active");
        });
    })
    .catch(err => {
        addMessage("Sorry, something went wrong.", "pico");
        speak("Sorry, something went wrong.");
        console.error(err);
    });
}

// Canvas waveform
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function drawWaveform() {
    requestAnimationFrame(drawWaveform);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Speaking Animation (smooth glowing wave)
    if (speakingAnimation) {
        let time = Date.now() / 300;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x++) {
            let y = canvas.height / 2 + Math.sin(x * 0.02 + time) * 20;
            ctx.lineTo(x, y);
        }

        let gradient = ctx.createLinearGradient(0,0,canvas.width,0);
        gradient.addColorStop(0,"#FF5252");
        gradient.addColorStop(0.5,"#FF8A80");
        gradient.addColorStop(1,"#FF5252");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.stroke();
        return;
    }

    // Listening Animation (microphone input)
    analyser.getByteTimeDomainData(dataArray);
    ctx.beginPath();

    let sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * canvas.height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
    }

    let gradient = ctx.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop(0,"#4CAF50");
    gradient.addColorStop(0.5,"#8BC34A");
    gradient.addColorStop(1,"#CDDC39");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();
}

    drawWaveform();
});
