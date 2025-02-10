import { useState, useEffect, useCallback } from 'react';

export const useConversation = () => {
  const [transcript, setTranscript] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [conversation, setConversation] = useState([]);

  const addUserMessage = useCallback((text) => {
    if (text.trim()) {
      const message = {
        text,
        speaker: 'user',
        timestamp: Date.now()
      };
      setCurrentText(text);
      setConversation(prev => [...prev, message]);
      setTranscript(prev => {
        const newTranscript = [...prev, message];
        return newTranscript.slice(-15);
      });
    }
  }, []);

  const addAssistantMessage = useCallback((text) => {
    if (text.trim()) {
      const message = {
        text,
        speaker: 'assistant',
        timestamp: Date.now()
      };
      setCurrentText(text);
      setConversation(prev => [...prev, message]);
      setTranscript(prev => {
        const newTranscript = [...prev, message];
        return newTranscript.slice(-15);
      });
    }
  }, []);

  const clearConversation = useCallback(() => {
    setTranscript([]);
    setConversation([]);
    setCurrentText('');
  }, []);

  return {
    transcript,
    currentText,
    conversation,
    addUserMessage,
    addAssistantMessage,
    clearConversation,
    setCurrentText
  };
}; 