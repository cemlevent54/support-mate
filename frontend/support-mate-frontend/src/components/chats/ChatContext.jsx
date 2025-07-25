import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [agentChats, setAgentChats] = useState([]);

  return (
    <ChatContext.Provider value={{
      unreadCounts,
      setUnreadCounts,
      agentChats,
      setAgentChats,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
} 