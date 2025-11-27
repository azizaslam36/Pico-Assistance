let isListening = false;
let voices = [];
let isSpeaking = false;  // Prevent conflicts between speaking & listening

// Get elements
const micButton = document.getElementById("mic-button");
const actionButton = document.getElementById("action-button");
const responseText = document.getElementById("response");
const canvas = document.getElementById("waveformCanvas");
const ctx = canvas.getContext("2d");

// Initialize Speech Recognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

// Check for browser support
if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser. Please use Chrome.");
}

// ✅ Load voices properly and retry if empty
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        setTimeout(loadVoices, 500);  // Retry if voices are not available yet
    }
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // Initial load

// ✅ Function to make Aly speak
function speak(text, callback = null) {
    if (voices.length === 0) {
        setTimeout(() => speak(text, callback), 500);
        return;
    }

    let speech = new SpeechSynthesisUtterance(text);
    let femaleVoice = voices.find(voice => voice.name.toLowerCase().includes("female")) || voices[0];

    speech.voice = femaleVoice;
    isSpeaking = true;

    speech.onend = () => {
        isSpeaking = false;
        if (callback) callback();
    };

    window.speechSynthesis.speak(speech);
}

// ✅ Start listening after Aly finishes speaking
function startListening() {
    actionButton.disabled = true;
    responseText.innerText = "Hi, Aly Here. How can I help you?";

    speak("Hi, Aly Here. How can I help you?", () => {
        responseText.innerText = "Listening...";
        recognition.start();
        isListening = true;
        actionButton.innerText = "Stop Listening";
        actionButton.disabled = false;
        micButton.classList.add("active"); // Mic animation starts
    });
}

// ✅ Handle Start/Stop Listening Button
actionButton.addEventListener("click", () => {
    window.speechSynthesis.resume();

    if (isSpeaking) return; // Prevent listening while speaking

    if (isListening) {
        recognition.stop();
        responseText.innerText = "Stopped Listening.";
        actionButton.innerText = "Start Listening";
        isListening = false;
        micButton.classList.remove("active"); // Mic animation stops
    } else {
        startListening();
    }
});

// ✅ Handle microphone button (direct listening)
micButton.addEventListener("click", () => {
    if (micButton.classList.contains("active")) {
        recognition.stop();
        micButton.classList.remove("active");
    } else {
        recognition.start();
        micButton.classList.add("active");
    }
});

// ✅ Handle Voice Input
recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    responseText.innerText = `You said: ${command}`;
    sendCommand(command);
};

// ✅ Stop mic animation when listening stops
recognition.onend = () => {
    isListening = false;
    micButton.classList.remove("active");
};

// ✅ Send command to Flask
function sendCommand(command) {
    fetch("/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: command })
    })
    .then(response => response.json())
    .then(data => {
        responseText.innerText = data.response;
        speak(data.response, () => {
            recognition.start();          // Restart listening
            responseText.innerText = "Listening...";
            isListening = true;
            actionButton.innerText = "Stop Listening";
            micButton.classList.add("active");
        });        
        if (data.redirect) {
            window.open(data.redirect, "_blank");
        }
    })
    .catch(error => console.error("Error:", error));
}

// Resize canvas to fit
canvas.width = window.innerWidth;
canvas.height = 100;

// Get user microphone input
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function drawWaveform() {
        requestAnimationFrame(drawWaveform);
        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;

        let sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * canvas.height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.stroke();
    }

    drawWaveform();
});