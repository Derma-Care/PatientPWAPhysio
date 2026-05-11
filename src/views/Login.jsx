import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CSpinner,
} from '@coreui/react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import Swal from 'sweetalert2';
import { Fingerprint, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [userName, setUserName] = useState('000101_CR_00066');
  const [password, setPassword] = useState('9686575675');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'biometric'
  const [isMobileOrTab, setIsMobileOrTab] = useState(window.innerWidth <= 1024);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTab(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);

    const isBioEnabled = localStorage.getItem('biometricEnabled') === 'true';
    if (isBioEnabled && window.innerWidth <= 1024) {
      setViewMode('biometric');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({
        userName,
        password,
        deviceId: "doc3O1rkTCKSoTfadDR8ap:APA91bFizh_rYgFk5CcAOjOSajPpzvIApq21uqd7O0DKLbqoUGt7dF_nVLeQXKu4eau9iXYrtp7KmfjDrfbNy5ZsDNwSIC7_2h93zkxA_4ucoJ-kHLKLX7A"
      });

      if (response.success) {
        const isBioEnabled = localStorage.getItem('biometricEnabled') === 'true';

        // Only ask for biometrics on mobile/tablet
        if (!isBioEnabled && isMobileOrTab) {
          const result = await Swal.fire({
            title: 'Enable Biometric?',
            text: 'Would you like to use biometric login for faster access next time?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Enable',
            cancelButtonText: 'Not now',
            confirmButtonColor: '#1B4F8A',
          });

          if (result.isConfirmed) {
            localStorage.setItem('biometricEnabled', 'true');
            localStorage.setItem('savedUserName', userName);
          }
        }

        login(response.data);
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome back, ${response.data.customerName}!`,
          timer: 2000,
          showConfirmButton: false,
        });
        navigate('/dashboard');
      } else {
        Swal.fire('Error', response.message || 'Login failed', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Something went wrong. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = () => {
    setBioLoading(true);
    setTimeout(() => {
      setBioLoading(false);
      Swal.fire({
        title: 'Biometric Authentication',
        text: 'Confirm your identity with FaceID / TouchID',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Authenticate',
        confirmButtonColor: '#1B4F8A',
      }).then((result) => {
        if (result.isConfirmed) {
          const savedUser = localStorage.getItem('savedUserName');
          if (savedUser) setUserName(savedUser);
          handleLogin();
        }
      });
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="text-center mb-3 mt-3">
            <h1 className="login-logo gradient-text">Kinetix Wellness Care</h1>
            <p className="login-subtitle">
              {viewMode === 'biometric' && isMobileOrTab ? 'Welcome back! Authenticate to continue' : 'Patient Portal Access'}
            </p>
          </div>

          {viewMode === 'biometric' && isMobileOrTab ? (
            <div className="text-center">
              <div className="mb-3 d-flex flex-column align-items-center">
                <div
                  className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '100px', height: '100px', border: '2px solid #e2e8f0' }}
                >
                  <User size={50} className="text-secondary" />
                </div>
                <h4 className="fw-bold text-dark mb-1">{localStorage.getItem('savedUserName') || 'Patient'}</h4>
                <p className="text-xs text-secondary">Logged in previously</p>
              </div>

              <button
                type="button"
                className="btn-login mb-4 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleBiometric}
                disabled={bioLoading}
              >
                {bioLoading ? <CSpinner size="sm" /> : <><Fingerprint size={24} /> Login with Biometrics</>}
              </button>

              <button
                type="button"
                className="btn-biometric border-0 bg-transparent text-primary fw-bold d-flex align-items-center justify-content-center gap-2"
                onClick={() => setViewMode('form')}
              >
                <ArrowLeft size={16} /> Use password instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="custom-input-group">
                <label>Username / Patient ID</label>
                <div className="custom-input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="custom-input"
                    required
                  />
                </div>
              </div>

              <div className="custom-input-group">
                <label>Security Password</label>
                <div className="custom-input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="custom-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-login mt-3"
                disabled={loading}
              >
                {loading ? <CSpinner size="sm" style={{ color: "white" }} /> : 'Login'}
              </button>

              {isMobileOrTab && (
                <div className="biometric-section">
                  <p className="text-xs text-secondary mb-3 uppercase fw-bold ls-1">Other Methods</p>
                  <button
                    type="button"
                    className="btn-biometric"
                    onClick={handleBiometric}
                    disabled={bioLoading}
                  >
                    {bioLoading ? <CSpinner size="sm" /> : <><Fingerprint size={20} /> Biometric Access</>}
                  </button>
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-xs text-secondary">
                  Forgot password? <span className="text-primary fw-bold cursor-pointer hover-primary">Reset here</span>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
