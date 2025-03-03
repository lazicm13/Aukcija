import ChatComponent from './../Components/Chat/ChatComponent';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ChatPage = () => {
  const { chatroomId } = useParams<{ chatroomId: string | undefined }>(); // Allow undefined
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (chatroomId) {
      setLoading(false);
    }
  }, [chatroomId]);

  if (loading || !chatroomId) {
    return <div>Loading...</div>; // Handle undefined or loading state
  }

  // Assuming chatroomId is now guaranteed to be a string here
  return (
    <div className="chat-page">
      <h1>Chat Room</h1>
      {/* Pass the chatroomId to ChatComponent, now it's a string */}
      <ChatComponent chatroomId={parseInt(chatroomId)} />
    </div>
  );
};

export default ChatPage;
