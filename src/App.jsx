import { useEffect, useState, useMemo, useRef } from "react";
import { useConversation } from "./hooks/useConversation";

import ActiveCallDetail from "./components/ActiveCallDetail";
import Button from "./components/base/Button";
import Vapi from "@vapi-ai/web";
import ErrorBoundary from "./ErrorBoundary";

import { getBobAssistant } from "./assistants";
import "./App.css";

const App = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const transcriptRef = useRef(null);
  const [tempUserText, setTempUserText] = useState('');
  const speechTimeoutRef = useRef(null);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);

  const {
    transcript,
    currentText,
    conversation,
    addUserMessage,
    addAssistantMessage,
    clearConversation,
    setCurrentText
  } = useConversation();

  const vapiClient = useMemo(() => new Vapi(
    process.env.REACT_APP_VAPI_PUBLIC_KEY ||
    process.env.PUBLIC_VAPI_KEY ||
    process.env.NEXT_PUBLIC_VAPI_KEY ||
    "",
    undefined,
    { alwaysIncludeMicInPermissionPrompt: true }
  ), []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, currentText]);

  // Local speech recognition
  const startSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;

      // Handle interim results and final results with pause detection
      recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;

        // Update the temporary text
        setTempUserText(text);

        // Clear any existing timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }

        // If it's a final result or there's a pause, add the message
        if (isFinal) {
          addUserMessage(text);
          setTempUserText('');
        } else {
          // Set a timeout to detect pause in speech
          speechTimeoutRef.current = setTimeout(() => {
            if (text.trim()) {
              addUserMessage(text);
              setTempUserText('');
            }
          }, 1000); // Adjust this value to change pause sensitivity (in milliseconds)
        }
      };

      recognition.onend = () => {
        // When recognition ends, add any remaining text
        if (tempUserText.trim()) {
          addUserMessage(tempUserText);
          setTempUserText('');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (tempUserText.trim()) {
          addUserMessage(tempUserText);
          setTempUserText('');
        }
      };

      recognition.start();
      return recognition;
    }
    console.warn('Speech recognition not supported in this browser');
    return null;
  };

  // Clean up the timeout on unmount or when recognition stops
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let recognition = null;

    vapiClient.on("call-start", () => {
      setConnecting(false);
      setConnected(true);
      clearConversation();
      recognition = startSpeechRecognition();
    });

    vapiClient.on("call-end", () => {
      setConnecting(false);
      setConnected(false);
      setCurrentText('');
      if (recognition) {
        recognition.stop();
      }
    });

    vapiClient.on("speech-start", () => {
      setAssistantIsSpeaking(true);
    });

    vapiClient.on("speech-end", () => {
      setAssistantIsSpeaking(false);
      setCurrentText('');
    });

    vapiClient.on("volume-level", (level) => {
      setVolumeLevel(level);
    });

    // Handle assistant responses
    vapiClient.on("response", (text) => {
      addAssistantMessage(text);
    });

    return () => {
      if (recognition) {
        recognition.stop();
      }
      vapiClient.removeAllListeners();
    };
  }, [vapiClient, addAssistantMessage, addUserMessage, clearConversation, setCurrentText]);

  // Add debug logging for transcript updates
  useEffect(() => {
    console.log("Transcript updated:", transcript);
  }, [transcript]);

  // call start handler
  const startCallInline = () => {
    setConnecting(true);
    getBobAssistant().then((assistant) => {
      vapiClient.start(assistant);
    });
  };

  const endCall = () => {
    console.log("Ending call");
    vapiClient.stop();
  };

  return (
    <ErrorBoundary>
      <div className={`app-wrapper ${assistantIsSpeaking || volumeLevel > 0 ? 'active' : ''}`}>
        <div className="animated-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div className="main-content">
          <div className={`card-container ${connected ? 'connected' : ''}`}>
            <img
              src="george.png"
              alt="George"
              className={`avatar ${assistantIsSpeaking ? 'speaking' : ''}`}
            />
            {!connected ? (
              <Button
                label="Start Call"
                onClick={startCallInline}
                isLoading={connecting}
              />
            ) : (
              <ActiveCallDetail
                assistantIsSpeaking={assistantIsSpeaking}
                volumeLevel={volumeLevel}
                onEndCallClick={endCall}
              />
            )}
          </div>
        </div>
        
        {/* Updated transcript area */}
        {connected && (
          <div className={`live-transcript ${isTranscriptVisible ? 'visible' : 'hidden'}`}>
            <div className="transcript-header">
              <span>Live Transcript {transcript.length > 0 ? `(${transcript.length})` : ''}</span>
              <div className="transcript-controls">
                {conversation.length > 0 && (
                  <button 
                    className="transcript-button"
                    onClick={() => {
                      const text = conversation
                        .map(msg => `${msg.speaker}: ${msg.text}`)
                        .join('\n');
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'conversation-transcript.txt';
                      a.click();
                    }}
                  >
                    <span className="button-icon">↓</span>
                    Download
                  </button>
                )}
                <button 
                  className="transcript-button toggle-button"
                  onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                >
                  <span className="button-icon">{isTranscriptVisible ? '▼' : '▲'}</span>
                  {isTranscriptVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="transcript-content" ref={transcriptRef}>
              <div className="messages-container">
                {transcript.length === 0 ? (
                  <div className="empty-transcript">Conversation will appear here...</div>
                ) : (
                  transcript.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`message ${msg.speaker}`}
                    >
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {/* Show temporary user text while speaking */}
                {tempUserText && (
                  <div className="message user current">
                    <div className="message-bubble">
                      {tempUserText}
                    </div>
                  </div>
                )}
                {/* Show assistant's current text */}
                {currentText && assistantIsSpeaking && (
                  <div className="message assistant current">
                    <div className="message-bubble">
                      {currentText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
