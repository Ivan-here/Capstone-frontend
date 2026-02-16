import React, { useEffect, useMemo, useState } from 'react';
import './Notifications.css';
import { notificationService } from '../../services/notification.service';
import { timeAgo, titleFromType } from '../../utils/notification.utils';

const READ_STORAGE_KEY = "read-notification-ids";

/** Fallback demo notifications */
const DUMMY_NOTIFICATIONS = [
  {
    id: "dummy-1",
    userId: "demo-user-1",
    type: "alert",
    message: "The apples in your cart are no longer available",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "dummy-2",
    userId: "demo-user-1",
    type: "success",
    message: "The baked goods you reserved are available",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "dummy-3",
    userId: "demo-user-1",
    type: "info",
    message: "There are new posts in the community",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "dummy-4",
    userId: "demo-user-1",
    type: "info",
    message: "There is one new like on your post",
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

function getUserId() {
  // Temporary until you have auth/login
  return localStorage.getItem("userId") || "demo-user-1";
}

function getReadSet() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveReadSet(set) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set]));
}

const Notifications = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [readSet, setReadSet] = useState(() => getReadSet());
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const unreadCount = useMemo(() => notes.filter(n => !n.read).length, [notes]);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setErrMsg("");
        setLoading(true);

        const userId = getUserId();

        let data;
        try {
          data = await notificationService.listByUser(userId);

          // If backend returns empty, use fallback so UI still looks good
          if (!data || data.length === 0) data = DUMMY_NOTIFICATIONS;
        } catch (e) {
          data = DUMMY_NOTIFICATIONS;

        }
        const freshReadSet = getReadSet();

        const mapped = (data || []).map((n) => {
          const locallyRead = freshReadSet.has(n.id);
          return {
            id: n.id,
            title: titleFromType(n.type),
            time: timeAgo(n.createdAt),
            message: n.message,
            type: n.type,
            read: !!n.read || locallyRead,
            createdAt: n.createdAt
          };
        });

        setNotes(mapped);
      } catch (e) {
        setErrMsg(e.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

  const markOneRead = (id) => {
    const next = new Set(readSet);
    next.add(id);
    setReadSet(next);
    saveReadSet(next);

    setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const next = new Set(readSet);
    notes.forEach(n => next.add(n.id));
    setReadSet(next);
    saveReadSet(next);

    setNotes(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <>
      {}
      <div className="notification-backdrop" onClick={onClose}></div>

      <div className="notification-dropdown">
        <div className="notification-header-row">
          <h2 className="notification-header">NOTIFICATIONS</h2>

          <button
            className="notification-markall"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            title="Mark all as read"
          >
            Mark all read
          </button>
        </div>

        {loading && <div className="notification-meta">Loading...</div>}
        {errMsg && <div className="notification-error">{errMsg}</div>}

        <div className="notification-list">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`notification-item ${note.read ? "read" : "unread"}`}
              onClick={() => markOneRead(note.id)}
            >
              <div className="note-top-row">
                <span className="note-title">
                  {!note.read && <span className="unread-dot" />}
                  {note.title}
                </span>
                <span className="note-time">{note.time}</span>
              </div>
              <p className="note-message">{note.message}</p>
            </div>
          ))}

          {!loading && !errMsg && notes.length === 0 && (
            <div className="notification-meta">No notifications yet.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;