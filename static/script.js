console.log("Pico JS Loaded");
alert("JS Loaded");

const CONFIG = {
    assistantName: "Pico",
    welcomeMessage: "Hello! I'm Pico. How can I help you today?",
    recognitionLanguage: "en-IN",
    typingDelay: 400,
    maxImageWidth: 350,
    maxImageHeight: 280,
    waveHeight: 80
};

class PicoAssistant {
    constructor() {
        // DOM Elements
        this.welcomeScreen = document.getElementById("welcome-screen");
        this.chatSection = document.getElementById("chat-section");
        this.chatWindow = document.getElementById("chat-window");
        this.textInput = document.getElementById("text-input");
        this.sendButton = document.getElementById("send-button");
        this.actionButton = document.getElementById("action-button");
        this.waveCanvas = document.getElementById("waveformCanvas");
        this.ctx = this.waveCanvas.getContext("2d");
        
        // App State
        this.chatStarted = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.speakingAnimation = false;
        this.typingBubble = null;
        this.voices = [];
        this.recognition = null;
        this.init();
    }

    // ----------------------------
    // Initialization
    // ----------------------------

    init(){
        
        this.loadVoices();
        this.initializeRecognition();
        this.bindEvents();
        this.initializeCanvas();
    }

    bindEvents(){
        this.sendButton.addEventListener("click", () => {
            this.handletextMessage();
        });
        this.textInput.addEventListener("keydown", (e) => {
            if(e.key === "Enter") {
                this.handleTextMessage();
            }
        });
        this.actionButton.addEventListener("click", () => {
            this.toggleListening();
        });
    }
    
    startchat(){
        if (this.chatStarted) return;
        this.chatStarted = true;
        this.welcomeScreen.style.display = "none";
        this.chatSection.style.display = "block";
    }
    getCurrentTime(){
        return new Date().toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit' });
        }
        
    scrollToBottom(){
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }

    
    // ----------------------------
    // Chat
    // ----------------------------

    
        /**    
         * create a chat message.
         * 
         * @param {string} sender - The sender of the message, either "user" or "pico".
         * @param {string} text - The text content of the message.
         * @param {string|null} imageUrl - Optional URL of an image to include in the message.
         */
        
    createMessage(sender, text, imageUrl = null) {
            
            const message = document.createElement("div");
            message.className = `message ${sender}`;
            const bubble = document.createElement("div");
            bubble.className = "bubble";
            
            //Sender Name
            const senderName = document.createElement("div");
            senderName.className = "sender";
            senderName.textContent = sender === "user" ? "You" : CONFIG.assistantName;

            //Message Text
            const messageText = document.createElement("div");
            messageText.className = "message-text";
            messageText.textContent = text;

            bubble.appendChild(senderName);
            bubble.appendChild(messageText);

            // Optional Image
            if (imageUrl) {
                const img = document.createElement("img");
                img.src = imageUrl;
                img.loading = "lazy";
                img.alt = "Pico Image";
                img.style.maxWidth = `${CONFIG.maxImageWidth}px`;
                img.style.maxHeight = `${CONFIG.maxImageHeight}px`;
                img.style.width = "100%";
                img.style.objectFit = "contain";
                img.style.marginTop = "12px";
                img.style.borderRadius = "15px";
                img.onerror = () => {
                    img.remove();
                };  
                bubble.appendChild(img);
            }

            // timestamp
            const time = document.createElement("div");
            time.className = "timestamp";
            time.textContent = this.getCurrentTime();
            bubble.appendChild(time);
            message.appendChild(bubble);
            this.chatWindow.appendChild(message);
            this.scrollToBottom();
        }

    handleTextMessage(){
        const text = this.textInput.value.trim();
        if (!text) return;
        this.startchat();
        this.createMessage("user", text);
        this.textInput.value = "";
        this.sendCommand(text);
    }

    showTyping(){
        if (this.typingBubble) return;
        const typing = document.createElement("div");
        typing.className = "message pico typing";

        typing.innerHTML = `
            <div class="bubble">
                <div class="sender">${CONFIG.assistantName}</div>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                </div> 
        `;
        this.typingBubble = typing;
        this.chatWindow.appendChild(typing);
        this.scrollToBottom();
    }

    removeTyping() {
    if (!this.typingBubble) return;
    this.typingBubble.remove();
    this.typingBubble = null;}

    scrollToBottom(){
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }


    // ----------------------------
    // Voice
    // ----------------------------

    /**
 * Initialize Speech Recognition
 */
    initializeRecognition(){
        const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser.");
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = CONFIG.recognitionLanguage;
        this.recognition.interimResults = false;
        this.recognition.continuous = false;
        this.recognition.maxAlternatives = 1;
        this.registerRecognitionEvents();
    }
    /**
     * Register recognition events
     * */
    registerRecognitionEvents(){
        this.recognition.onstart = () => {
            this.isListening = true;
            this.actionButton.classList.add("listening");
            this.actionButton.innerHTML = 
            `<i class="fas fa-microphone-slash"></i>
            <span>Listening...</span>
            `;
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.actionButton.classList.remove("listening");
            this.actionButton.innerHTML = 
            `<i class="fas fa-microphone"></i>
            <span>Start Listening</span>
            `;
        };
        this.recognition.onerror = (event) => {
            console.error(event.error);
        };
        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.handleVoiceMessage(text);
        };
    }

    startListening(){
        if (!this.recognition) return;
        if (this.isListening) return;
        this.recognition.start();
    }

    stopListening(){
        if (!this.recognition) return;
        this.recognition.stop();
    }
    toggleListening(){
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    handleVoiceMessage(text){
        if (!text) return;
        this.startchat();
        this.createMessage("user", text);
        this.sendCommand(text);
    }
    loadVoices(){
        this.voices = window.speechSynthesis.getVoices();
        if (this.voices.length === 0) {
            setTimeout(() => {
                this.loadVoices();
            }, 300);
        }
    }

    speak(text,callback = null){
        if (!text) return;
        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(text);
        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;
        speech.lang = "en-IN";

        const female =
    this.voices.find(v => 
        v.name.toLowerCase().includes("female")
    );
    if (female) 
        speech.voice = female;
    this.isSpeaking = true;
    this.speakingAnimation = true;
    speech.onend = () => {
        this.isSpeaking = false;
        this.speakingAnimation = false;
        if (callback) callback();
    };
    window.speechSynthesis.speak(speech);
    }

    // ----------------------------
    // Backend
    // ----------------------------
    
    async sendCommand(command){
        this.showTyping();
        try {
            const response = await fetch("/command", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query:command })
            });
            if (!response.ok) {
                throw new Error("server error");
            }
            const data = await response.json();
            this.removeTyping();
            this.createMessage(
                "pico", 
                data.response,
                data.image|| null
            );
            this.speak(data.response);
        }
        catch (error) {
            console.error(error);
            this.removeTyping();
            this.createMessage(
                "pico", 
                "Sorry, something went wrong.",
                null
            );
            this.speak("Sorry, something went wrong.");
        }
    }
    // ----------------------------
    // wave
    // ----------------------------

    initializeCanvas(){
        this.resizeCanvas();
        window.addEventListener("resize", () => {
            this.resizeCanvas();
        });
        this.initializeMicrophone();
    }

    resizeCanvas(){
        this.waveCanvas.width = 
        this.waveCanvas.offsetWidth;
        this.waveCanvas.height =
        this.waveCanvas.offsetHeight;
    }
    async initializeMicrophone(){
        try {
            const stream =
    await navigator.mediaDevices.getUserMedia({ 
        audio: true 
    });
    this.audioContext = 
    new AudioContext();
    this.analyser =
    this.audioContext.createAnalyser();
    const source =
    this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.drawWave();
    }
    catch (error) {
        console.error(error);
    }
    }

    drawWave(){
        requestAnimationFrame(() => this.drawWave());
        this.ctx.clearRect(0, 0, this.waveCanvas.width, this.waveCanvas.height);
        if (this.speakingAnimation) {
            this.drawSpeakingWave();
        }
        else {
            this.drawListeningWave();
        }
    }

    drawSpeakingWave(){
        const time = Date.now() / 300;
        this.ctx.beginPath();
        for (let x = 0; x < this.waveCanvas.width; x++) {
            const y = this.waveCanvas.height / 2 + Math.sin(x * 0.02 + time) * 20;
            if (x === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        const gradient = this.ctx.createLinearGradient(0, 0, this.waveCanvas.width, 0);
        gradient.addColorStop(0, "#10A37F");
        gradient.addColorStop(0.5, "#19C37D");
        gradient.addColorStop(1, "#10A37F");
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }
    drawListeningWave(){
        this.analyser.getByteTimeDomainData(this.dataArray);
        this.ctx.beginPath();
        let sliceWidth = this.waveCanvas.width / this.bufferLength;
        let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            let v = this.dataArray[i] / 128.0;
            let y = v * this.waveCanvas.height / 2;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
            x += sliceWidth;
        }
        this.ctx.strokeStyle = "#10A37F";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
}


document.addEventListener("DOMContentLoaded", () => {
    new PicoAssistant();
});