import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';
import { notificationService } from '../../services/notification.service';
import { authService } from '../../services/auth.service';
import { timeAgo, titleFromType } from '../../utils/notification.utils';

function mapNotification(n) {
  return {
    id: n.id,
    title: titleFromType(n.type, n.title),
    time: timeAgo(n.createdAt),
    message: n.message,
    type: n.type,
    read: !!n.read,
    createdAt: n.createdAt,
    targetUrl: n.targetUrl || null,
    actorDisplayName: n.actorDisplayName || null,
    actorUsername: n.actorUsername || null,
    referenceId: n.referenceId || null,
  };
}

const Notifications = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const userId = authService.getUserId();
  const isLoggedIn = authService.isLoggedIn();
  const unreadCount = useMemo(() => notes.filter((n) => !n.read).length, [notes]);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      if (!isLoggedIn || !userId) {
        setNotes([]);
        setErrMsg('');
        return;
      }

      try {
        setErrMsg('');
        setLoading(true);

        const data = await notificationService.listByUser(userId);
        const mapped = (Array.isArray(data) ? data : []).map(mapNotification);

        setNotes(mapped);
      } catch (e) {
        setErrMsg(e.message || 'Failed to load notifications.');
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, isLoggedIn, userId]);

  const handleNotificationClick = async (note) => {
    try {
      if (!note.read) {
        const updated = await notificationService.markRead(note.id, true);
        setNotes((prev) => prev.map((item) => (
          item.id === note.id
            ? (updated ? mapNotification(updated) : { ...item, read: true })
            : item
        )));
      }
    } catch (e) {
      setErrMsg(e.message || 'Failed to update the notification.');
    }

    if (note.targetUrl) {
      navigate(note.targetUrl);
      onClose?.();
    }
  };

  const markAllRead = async () => {
    if (!userId || unreadCount === 0) return;

    try {
      const updated = await notificationService.markAllRead(userId);
      if (Array.isArray(updated) && updated.length > 0) {
        const updatedMap = new Map(updated.map((item) => [item.id, item]));
        setNotes((prev) => prev.map((item) => {
          const fresh = updatedMap.get(item.id);
          return fresh ? mapNotification(fresh) : { ...item, read: true };
        }));
      } else {
        setNotes((prev) => prev.map((item) => ({ ...item, read: true })));
      }
      setErrMsg('');
    } catch (e) {
      setErrMsg(e.message || 'Failed to mark all notifications as read.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-backdrop" onClick={onClose}></div>

      <div className="notification-dropdown">
        <div className="notification-header-row">
          <h2 className="notification-header">NOTIFICATIONS</h2>

          <button
            className="notification-markall"
            onClick={markAllRead}
            disabled={!isLoggedIn || unreadCount === 0}
            title="Mark all as read"
          >
            Mark all read
          </button>
        </div>

        {!isLoggedIn && (
          <div className="notification-meta">Log in to see your notifications.</div>
        )}

        {loading && <div className="notification-meta">Loading...</div>}
        {errMsg && <div className="notification-error">{errMsg}</div>}

        <div className="notification-list">
          {!loading && isLoggedIn && notes.map((note) => (
            <div
              key={note.id}
              className={`notification-item ${note.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleNotificationClick(note);
                }
              }}
            >
              <div className="note-top-row">
                <span className="note-title">
                  {!note.read && <span className="unread-dot" />}
                  {note.title}
                </span>
                <span className="note-time">{note.time}</span>
              </div>
              <p className="note-message">{note.message}</p>
              {note.targetUrl && <div className="note-action">Open</div>}
            </div>
          ))}

          {!loading && isLoggedIn && !errMsg && notes.length === 0 && (
            <div className="notification-meta">No notifications yet.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
