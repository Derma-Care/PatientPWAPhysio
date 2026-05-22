import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CFormCheck } from '@coreui/react';
import { ShieldCheck, Fingerprint, ArrowLeft, Smartphone } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [biometricEnabled, setBiometricEnabled] = useState(
    localStorage.getItem('biometricEnabled') === 'true'
  );
  const isMobileOrTab = window.innerWidth <= 1024;

  const handleBiometricToggle = (e) => {
    const newVal = e.target.checked;
    setBiometricEnabled(newVal);
    localStorage.setItem('biometricEnabled', newVal.toString());
  };

  return (
    <div className="app-page">

      {/* ── Hero ── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          <h2 className="app-hero-title">Settings</h2>
          <p className="app-hero-sub">Manage your account security and preferences</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="app-body" style={{ paddingTop: 24 }}>

        {/* Security & Access card */}
        <div className="app-card" style={{ maxWidth: 600 }}>
          <div className="app-card-header">
            <div className="app-card-header-left">
              <div className="app-icon-box app-icon-navy">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="app-card-title">Security &amp; Access</p>
                <p className="app-card-sub">Authentication &amp; login preferences</p>
              </div>
            </div>
          </div>

          <div className="app-card-body" style={{ padding: '4px 0 0' }}>

            {/* Biometric row */}
            <div
              className="app-info-item"
              style={{
                borderRadius: 0,
                border: 'none',
                borderBottom: '1px solid var(--c-border-light)',
                justifyContent: 'space-between',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="app-icon-box app-icon-navy">
                  <Fingerprint size={22} />
                </div>
                <div>
                  <p className="app-info-value">Biometric Login</p>
                  <p className="app-info-sub">Use FaceID / TouchID for faster access</p>
                </div>
              </div>

              {isMobileOrTab ? (
                <CFormCheck
                  switch
                  id="biometricSwitch"
                  checked={biometricEnabled}
                  onChange={handleBiometricToggle}
                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                />
              ) : (
                <span
                  className="app-status-pill app-status-default"
                  style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}
                >
                  <Smartphone size={10} /> Mobile only
                </span>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;