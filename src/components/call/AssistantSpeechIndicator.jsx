import React from "react";

const AssistantSpeechIndicator = ({ isSpeaking }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          backgroundColor: isSpeaking ? "#3ef07c" : "#f03e3e",
          marginRight: "10px",
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

export default AssistantSpeechIndicator;
