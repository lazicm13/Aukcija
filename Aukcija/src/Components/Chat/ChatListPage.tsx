import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ChatListPage = () => {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const response = await fetch('http://localhost:8000/api/chatrooms/');
      const data = await response.json();
      setChatRooms(data);
      setLoading(false);
    };

    fetchChatRooms();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>My Chat Rooms</h1>
      <ul>
        {chatRooms.map((room) => (
          <li key={room.id}>
            <Link to={`/chat/${room.id}`}>{`Chat Room ${room.id}`}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatListPage;
