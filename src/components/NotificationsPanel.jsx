import React from 'react';
import { COffcanvas, COffcanvasHeader, COffcanvasTitle, COffcanvasBody, CBadge } from '@coreui/react';
import { Bell, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPanel = ({ visible, setVisible }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();

  return (
    <COffcanvas placement="end" visible={visible} onHide={() => setVisible(false)} style={{ width: 380, borderLeft: '1px solid var(--c-border)' }}>
      <COffcanvasHeader style={{ borderBottom: '1px solid var(--c-border)', padding: '16px 20px', background: 'var(--c-surface-2)' }}>
        <COffcanvasTitle style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700 }}>
          <Bell size={18} color="var(--c-navy)" />
          Notifications
          {unreadCount > 0 && <CBadge color="danger" shape="rounded-pill">{unreadCount} new</CBadge>}
        </COffcanvasTitle>
      </COffcanvasHeader>
      <COffcanvasBody style={{ padding: 0, background: 'var(--c-surface)' }}>
        
        {/* Actions Header */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
            <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Mark all read
            </button>
            <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', color: 'var(--c-danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} /> Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div style={{ padding: '8px 0' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--c-text-3)' }}>
              <Bell size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>No notifications yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--c-border-light)',
                  background: notif.read ? 'var(--c-surface)' : 'var(--c-navy-xlight)',
                  transition: 'background 0.2s',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: notif.read ? 600 : 700, color: 'var(--c-text)' }}>
                      {notif.title}
                    </h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--c-text-2)', lineHeight: 1.4 }}>
                      {notif.body}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--c-text-3)', fontWeight: 500 }}>
                      <Clock size={12} />
                      {new Date(notif.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                    style={{
                      background: 'none', border: 'none', padding: 6,
                      color: 'var(--c-text-3)', cursor: 'pointer',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.background = 'var(--c-danger-light)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--c-text-3)'; e.currentTarget.style.background = 'none'; }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                
                {!notif.read && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--c-navy)' }} />
                )}
              </div>
            ))
          )}
        </div>
      </COffcanvasBody>
    </COffcanvas>
  );
};

export default NotificationsPanel;
