import { useEffect, useState } from "react";

import ActiveCallDetail from "./components/ActiveCallDetail";
import Button from "./components/base/Button";
import Vapi from "@vapi-ai/web";

import { getBobAssistant } from "./assistants";

const vapi = new Vapi(process.env.REACT_APP_VAPI_PUBLIC_KEY || process.env.PUBLIC_VAPI_KEY || process.env.NEXT_PUBLIC_VAPI_KEY  || "");

const App = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // hook into Vapi events
  useEffect(() => {
    vapi.on("call-start", () => {
      setConnecting(false);
      setConnected(true);
    });

    vapi.on("call-end", () => {
      setConnecting(false);
      setConnected(false);
    });

    vapi.on("speech-start", () => {
      setAssistantIsSpeaking(true);
    });

    vapi.on("speech-end", () => {
      setAssistantIsSpeaking(false);
    });

    vapi.on("volume-level", (level) => {
      setVolumeLevel(level);
    });

    vapi.on("error", (error) => {
      console.error(error);

      setConnecting(false);
    });

    // we only want this to fire on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // call start handler
  const startCallInline = () => {
    setConnecting(true);
    getBobAssistant().then(assistant => {
      vapi.start(assistant);
    });
  };

  const endCall = () => {
    vapi.stop();
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        display: "block",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100vw",
            height: "60vh",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img 
            src="bob.png" alt="Bob"
            style={{
              display: "flex",
              width: 300,
              marginBottom: 20,
            }}
          />
          {!connected ? (
            <Button
              label="Place an order "
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
        <iframe
          id="distru-product-menu-iframe-id"
          src="https://app.distru.com/companies/1/menu/3051"
          scrolling="no"
          style={{border: "none", minHeight: 1000, overflow: "hidden",}}
          width="100%"
        ></iframe>
      </div>
    </div>
  );
};

export default App;
