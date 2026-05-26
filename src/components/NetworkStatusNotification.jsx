import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, ServerCrash, X } from 'lucide-react';
import './NetworkStatusNotification.css';

const NetworkStatusNotification = () => {
  const [status, setStatus] = useState(null); // 'offline' | 'slow' | 'server-down' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Monitor Online/Offline Status
    const handleOnline = () => {
      setStatus(null);
      setVisible(false);
    };

    const handleOffline = () => {
      setStatus('offline');
      setVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    // 2. Monitor Network Speed (Slow Connection)
    const checkConnectionSpeed = () => {
      if (navigator.connection) {
        const { effectiveType } = navigator.connection;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setStatus('slow');
          setVisible(true);
        }
      }
    };

    checkConnectionSpeed();
    if (navigator.connection) {
      navigator.connection.addEventListener('change', checkConnectionSpeed);
    }

    // 3. Monitor Server Offline Custom Event
    const handleServerDown = () => {
      setStatus('server-down');
      setVisible(true);
    };

    window.addEventListener('api-server-down', handleServerDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', checkConnectionSpeed);
      }
      window.removeEventListener('api-server-down', handleServerDown);
    };
  }, []);

  // 4. Auto-Dismiss Timer for temporary states (Slow Connection, Server Connection Error)
  useEffect(() => {
    if (visible && status && status !== 'offline') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, status]);

  if (!visible || !status) return null;

  const contentMap = {
    'offline': {
      icon: <WifiOff className="ns-icon ns-icon-error" size={20} />,
      title: 'You are offline',
      message: 'Please check your Wi-Fi or cellular network connection.',
      colorClass: 'ns-error',
      persistent: true
    },
    'slow': {
      icon: <AlertTriangle className="ns-icon ns-icon-warning" size={20} />,
      title: 'Slow internet connection',
      message: 'Some actions or data may take longer to load than usual.',
      colorClass: 'ns-warning',
      persistent: false
    },
    'server-down': {
      icon: <ServerCrash className="ns-icon ns-icon-danger" size={20} />,
      title: 'Server Connection Error',
      message: 'Unable to reach the servers. Please try again in a few moments.',
      colorClass: 'ns-danger',
      persistent: false
    }
  };

  const currentContent = contentMap[status];

  return (
    <div className={`ns-card-wrapper ${currentContent.colorClass}`}>
      <div className="ns-card-inner">
        <div className="ns-card-left">
          {currentContent.icon}
          <div className="ns-card-text">
            <h5 className="ns-title">{currentContent.title}</h5>
            <p className="ns-message">{currentContent.message}</p>
          </div>
        </div>
        <button className="ns-close-btn" onClick={() => setVisible(false)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NetworkStatusNotification;
