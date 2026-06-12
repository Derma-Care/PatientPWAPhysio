import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, Trash2, CheckCheck, Clock,
  BellOff, Sparkles, ShieldCheck
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ── icon based on title keyword ─────────────────────────────────────────── */
const getIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('appoint') || t.includes('booking')) return '📅';
  if (t.includes('payment') || t.includes('bill'))    return '💳';
  if (t.includes('result')  || t.includes('report'))  return '📋';
  if (t.includes('remind'))                           return '⏰';
  if (t.includes('welcome') || t.includes('hello'))   return '👋';
  if (t.includes('cancel'))                           return '❌';
  if (t.includes('complete') || t.includes('done'))   return '✅';
  return '🔔';
};

/* ── component ───────────────────────────────────────────────────────────── */
const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications, unreadCount,
    markAsRead, markAllAsRead,
    clearNotification, clearAllNotifications,
    refreshFromDB,
  } = useNotifications();

  // Always pull latest from IndexedDB when this page opens
  useEffect(() => {
    refreshFromDB();
  }, [refreshFromDB]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg, #f4f6fb)' }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6e 60%, #1d4ed8 100%)',
        padding: '0 0 28px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          background: 'rgba(96,165,250,0.12)', borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -30, width: 220, height: 220,
          background: 'rgba(59,130,246,0.08)', borderRadius: '50%',
        }} />

        {/* top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 0',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          {/* unread badge */}
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff',
              padding: '4px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 0 0 3px rgba(239,68,68,0.25)',
            }}>
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* title row */}
        <div style={{ padding: '20px 20px 0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <Bell size={20} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              Notifications
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)', paddingLeft: 2 }}>
            {notifications.length === 0
              ? 'No notifications yet'
              : `${notifications.length} notification${notifications.length > 1 ? 's' : ''} · ${unreadCount} unread`}
          </p>
        </div>
      </div>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        {notifications.length > 0 && (
          <div style={{
            display: 'flex', gap: 10, marginBottom: 0,
          }}>
            <button
              onClick={markAllAsRead}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#fff', border: '1.5px solid #e0e7ef',
                color: '#1d4ed8', fontSize: 13, fontWeight: 700,
                padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; }}
              onMouseOut={e  => { e.currentTarget.style.background = '#fff'; }}
            >
              <CheckCheck size={15} /> Mark all read
            </button>
            <button
              onClick={clearAllNotifications}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#fff', border: '1.5px solid #fde8e8',
                color: '#ef4444', fontSize: 13, fontWeight: 700,
                padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#fff5f5'; }}
              onMouseOut={e  => { e.currentTarget.style.background = '#fff'; }}
            >
              <Trash2 size={15} /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Notifications List ───────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 32px' }}>

        {/* Empty state */}
        {notifications.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 20,
            padding: '60px 24px', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e8edf5',
            marginTop: 8,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <BellOff size={36} color="#93c5fd" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
              All caught up!
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              When your clinic sends alerts,<br />they'll show up here.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 20, color: '#94a3b8', fontSize: 12,
            }}>
              <ShieldCheck size={14} /> Notifications are end-to-end secured
            </div>
          </div>
        )}

        {/* Items */}
        {notifications.map((notif, idx) => (
          <div
            key={notif.id}
            onClick={() => !notif.read && markAsRead(notif.id)}
            style={{
              background: notif.read ? '#fff' : 'linear-gradient(135deg,#eff6ff 0%,#fff 100%)',
              borderRadius: 16,
              padding: '16px 16px 14px',
              marginBottom: idx < notifications.length - 1 ? 10 : 0,
              border: notif.read ? '1px solid #e8edf5' : '1.5px solid #bfdbfe',
              boxShadow: notif.read
                ? '0 2px 8px rgba(0,0,0,0.04)'
                : '0 4px 16px rgba(59,130,246,0.10)',
              position: 'relative',
              cursor: notif.read ? 'default' : 'pointer',
              transition: 'all 0.25s',
              overflow: 'hidden',
            }}
          >
            {/* Unread left strip */}
            {!notif.read && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: 'linear-gradient(to bottom,#3b82f6,#1d4ed8)',
                borderRadius: '16px 0 0 16px',
              }} />
            )}

            <div style={{ display: 'flex', gap: 14, paddingLeft: notif.read ? 0 : 4 }}>

              {/* Icon chip */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: notif.read
                  ? 'linear-gradient(135deg,#f1f5f9,#e2e8f0)'
                  : 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {getIcon(notif.title)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h4 style={{
                    margin: 0, fontSize: 15,
                    fontWeight: notif.read ? 600 : 800,
                    color: notif.read ? '#334155' : '#1e3a8a',
                    lineHeight: 1.3,
                    flex: 1, paddingRight: 8,
                    whiteSpace: 'normal', wordBreak: 'break-word',
                  }}>
                    {notif.title}
                  </h4>

                  {/* Delete button */}
                  <button
                    onClick={e => { e.stopPropagation(); clearNotification(notif.id); }}
                    style={{
                      background: 'none', border: 'none', padding: '2px 4px',
                      color: '#cbd5e1', cursor: 'pointer', flexShrink: 0,
                      borderRadius: 6, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                    onMouseOut={e  => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none'; }}
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p style={{
                  margin: '0 0 10px', fontSize: 13, color: '#64748b',
                  lineHeight: 1.55, wordBreak: 'break-word',
                }}>
                  {notif.body}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                    <Clock size={11} />
                    {formatDate(notif.date)}
                  </div>
                  {!notif.read && (
                    <span style={{
                      background: '#3b82f6', color: '#fff',
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      NEW
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* All read tip */}
        {notifications.length > 0 && unreadCount === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: '#94a3b8', fontSize: 12, marginTop: 20,
          }}>
            <Sparkles size={13} /> All notifications have been read
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
