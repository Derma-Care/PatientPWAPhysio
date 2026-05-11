import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormCheck,
  CButton,
} from '@coreui/react';
import {
  ShieldCheck,
  Fingerprint,
  ArrowLeft
} from 'lucide-react';

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
    <div className="fade-in">
      <div className="d-flex align-items-center gap-3 mb-4">
        <CButton
          color="light"
          className="rounded-circle p-2 shadow-sm border-0 bg-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} className="text-dark" />
        </CButton>
        <div>
          <h2 className="fw-bold text-dark m-0">Settings</h2>
          <p className="text-secondary m-0">Manage your account security and preferences</p>
        </div>
      </div>

      <CRow>
        <CCol md={6}>
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <h5 className="mb-4 fw-bold d-flex align-items-center gap-2 text-primary">
                <ShieldCheck size={20} /> Security & Access
              </h5>

              <div className="d-flex align-items-center justify-content-between py-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                    <Fingerprint size={24} className="text-white" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">Biometric Login</h6>
                    <p className="text-secondary small mb-0">Use FaceID / TouchID for faster access</p>
                  </div>
                </div>
                {isMobileOrTab ? (
                  <CFormCheck
                    switch
                    id="biometricSwitch"
                    checked={biometricEnabled}
                    onChange={handleBiometricToggle}
                  />
                ) : (
                  <span className="text-secondary x-small fw-bold bg-light px-2 py-1 rounded" style={{ fontSize: '0.65rem' }}>MOBILE ONLY</span>
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default Settings;
