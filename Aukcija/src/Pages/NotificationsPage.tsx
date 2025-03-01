import { useEffect, useState } from 'react';
import api from '../api';
import './../Styles/notifications.css';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get<Notification[]>('/api/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/mark-as-read/`);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // // Funkcija za brisanje notifikacije
  // const deleteNotification = async (id: number) => {
  //   try {
  //     await api.delete(`/api/notifications/${id}/`);
  //     setNotifications(prevNotifications =>
  //       prevNotifications.filter(notification => notification.id !== id)
  //     );
  //   } catch (error) {
  //     console.error('Error deleting notification:', error);
  //   }
  // };

  useEffect(() => {
    fetchNotifications(); // Učitaj notifikacije kada se komponenta učita
  }, []);
  
  return (
    <div className="notifications-page">
      <h1>Moje notifikacije</h1>
  
      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>Trenutno nemate notifikacije</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.is_read ? 'read' : 'unread'}>
              
              {/* Prikaz poruke sa prelomima linija */}
              <p dangerouslySetInnerHTML={{ __html: notification.message.replace(/\n/g, '<br>') }}></p>
  
              <div className='button-container'>
                {!notification.is_read && (
                  <button onClick={() => markAsRead(notification.id)}>Označi kao pročitano</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
}

export default NotificationsPage;
