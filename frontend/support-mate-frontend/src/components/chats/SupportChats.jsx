import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatArea from './ChatArea';
import TaskCreateModal from './TaskCreateModal';
import Box from '@mui/material/Box';

export default function SupportChats() {
  // Örnek chat listesi ve mesajlar
  const chatList = [
    { id: 1, name: 'Kullanıcı 1', last: 'Merhaba, bir sorum var.' },
    { id: 2, name: 'Kullanıcı 2', last: 'Teşekkürler, iyi çalışmalar.' },
    { id: 3, name: 'Kullanıcı 3', last: 'Destek talebim var.' },
  ];
  const initialMessages = [
    [
      { from: 'user', text: 'Merhaba, bir sorum var.', time: '10:00' },
      { from: 'support', text: 'Tabii, nasıl yardımcı olabilirim?', time: '10:01' },
    ],
    [
      { from: 'user', text: 'Teşekkürler, iyi çalışmalar.', time: '09:30' },
      { from: 'support', text: 'Size de iyi günler!', time: '09:31' },
    ],
    [
      { from: 'user', text: 'Destek talebim var.', time: '11:00' },
      { from: 'support', text: 'Talebinizi iletebilirsiniz.', time: '11:01' },
    ],
  ];
  const [activeChat, setActiveChat] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev =>
      prev.map((arr, idx) =>
        idx === activeChat
          ? [...arr, { from: 'support', text: input, time }]
          : arr
      )
    );
    setInput("");
  };

  const openTaskModal = () => setTaskModalOpen(true);
  const closeTaskModal = () => setTaskModalOpen(false);

  // Render sırasında logla
  console.log("SupportChats render: messages", messages);
  console.log("SupportChats render: activeChat", activeChat);
  console.log("SupportChats render: currentChatMessages", messages[activeChat]);

  return (
    <Box display="flex" height="100%" boxShadow={2} borderRadius={2} bgcolor="#fff" overflow="hidden">
      <ChatList chatList={chatList} activeChat={activeChat} setActiveChat={setActiveChat} />
      <ChatArea
        messages={messages[activeChat] || []}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        openTaskModal={openTaskModal}
      />
      <TaskCreateModal open={taskModalOpen} onClose={closeTaskModal} />
    </Box>
  );
} 