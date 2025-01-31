import { useEffect, useState } from 'react';
import api from '../api';

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
      await api.post(`/api/notifications/${id}/mark-as-read/`);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Funkcija za brisanje notifikacije
  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}/`);
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Učitaj notifikacije kada se komponenta učita
  }, []);

  return (
    <div className="notifications-page">
      <h1>My Notifications</h1>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.is_read ? 'read' : 'unread'}>
              <p>{notification.message}</p>
              <div>
                {!notification.is_read && (
                  <button onClick={() => markAsRead(notification.id)}>Mark as Read</button>
                )}
                <button onClick={() => deleteNotification(notification.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
