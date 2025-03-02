import { useState, useEffect, useRef } from 'react';

const ChatComponent = ({ chatroomId }: { chatroomId: number }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Povezivanje na WebSocket server
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${chatroomId}/`);
    
    socketRef.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      socketRef.current?.close();
    };
  }, [chatroomId]);

  const sendMessage = () => {
    if (socketRef.current && newMessage.trim()) {
      socketRef.current.send(
        JSON.stringify({ content: newMessage })
      );
      setNewMessage('');
    }
  };

  return (
    <div>
      <div>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.sender}</strong>: {message.content}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatComponent;
