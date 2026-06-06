import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show the splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for fade out animation to finish before removing
      setTimeout(() => {
        onFinish();
      }, 500); // 500ms fade out duration
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-screen ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-logo-container">
        <img src="/kinetix-logo.png" alt="Kinetix Logo" className="splash-logo pulse-animation" />
      </div>
    </div>
  );
};

export default SplashScreen;
