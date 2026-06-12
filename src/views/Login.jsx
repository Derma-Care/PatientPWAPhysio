import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { toast, confirmDialog } from '../utils/toast';
import { Fingerprint, User, Lock, Eye, EyeOff, ArrowLeft, Heart } from 'lucide-react';

const Login = () => {
  const [userName, setUserName] = useState('000101_CR_');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [viewMode, setViewMode] = useState('form');
  const [isMobileOrTab, setIsMobileOrTab] = useState(window.innerWidth <= 1024);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobileOrTab(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    const isBioEnabled = localStorage.getItem('biometricEnabled') === 'true';
    if (isBioEnabled && window.innerWidth <= 1024) setViewMode('biometric');
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const executeLogin = async (uName, pwd) => {
    try {
      const response = await authService.login({
        userName: uName,
        password: pwd,
        deviceId: "doc3O1rkTCKSoTfadDR8ap:APA91bFizh_rYgFk5CcAOjOSajPpzvIApq21uqd7O0DKLbqoUGt7dF_nVLeQXKu4eau9iXYrtp7KmfjDrfbNy5ZsDNwSIC7_2h93zkxA_4ucoJ-kHLKLX7A"
      });
      if (response.success) {
        const isBioEnabled = localStorage.getItem('biometricEnabled') === 'true';
        if (!isBioEnabled && isMobileOrTab) {
          const confirmed = await confirmDialog(
            'Enable Biometric?',
            'Would you like to use biometric login for faster access next time?',
            { confirmText: 'Yes, Enable', cancelText: 'Not now' }
          );
          if (confirmed) {
            let registrationSuccess = true;
            if (window.PublicKeyCredential) {
              try {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                const userId = new Uint8Array(16);
                window.crypto.getRandomValues(userId);
                const cred = await navigator.credentials.create({
                  publicKey: {
                    challenge,
                    rp: { name: "PhysioCare", id: window.location.hostname },
                    user: { id: userId, name: uName, displayName: uName },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "preferred" },
                    timeout: 60000,
                  }
                });
                localStorage.setItem('bioCredId', btoa(String.fromCharCode.apply(null, new Uint8Array(cred.rawId))));
              } catch (err) {
                console.error("Registration failed:", err);
                registrationSuccess = false;
                if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
                  toast.error('Biometric Error', 'Could not register fingerprint/FaceID.');
                }
              }
            }
            if (registrationSuccess) {
              localStorage.setItem('biometricEnabled', 'true');
              localStorage.setItem('savedUserName', uName);
              localStorage.setItem('savedPassKey', btoa(pwd));
            }
          }
        } else if (isBioEnabled) {
          localStorage.setItem('savedUserName', uName);
          localStorage.setItem('savedPassKey', btoa(pwd));
        }
        login(response.data);
        toast.success('Login Successful', `Welcome back, ${response.data.customerName}!`);
        navigate('/dashboard');
      } else {
        toast.error('Login Failed', response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('Error', 'Something went wrong. Please check your credentials.');
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    await executeLogin(userName, password);
    setLoading(false);
  };

  const handleBiometric = async () => {
    const savedPass = localStorage.getItem('savedPassKey');
    if (!savedPass) {
      toast.error('Setup Required', 'Please sign in with your password once to complete biometric setup.');
      setViewMode('form');
      return;
    }

    setBioLoading(true);
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        let credId = localStorage.getItem('bioCredId');
        
        if (credId) {
          // Prompt for existing fingerprint
          const idBuffer = Uint8Array.from(atob(credId), c => c.charCodeAt(0));
          await navigator.credentials.get({
            publicKey: {
              challenge,
              allowCredentials: [{ type: "public-key", id: idBuffer }],
              userVerification: "preferred"
            }
          });
        } else {
          // Register new fingerprint
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);
          const cred = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "PhysioCare", id: window.location.hostname },
              user: {
                id: userId,
                name: localStorage.getItem('savedUserName') || "Patient",
                displayName: localStorage.getItem('savedUserName') || "Patient"
              },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }],
              authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "preferred" },
              timeout: 60000,
            }
          });
          localStorage.setItem('bioCredId', btoa(String.fromCharCode.apply(null, new Uint8Array(cred.rawId))));
        }
        
        const savedUser = localStorage.getItem('savedUserName');
        const savedPass = localStorage.getItem('savedPassKey');
        if (savedUser) setUserName(savedUser);
        if (savedPass) setPassword(atob(savedPass));
        // Use the saved credentials directly to avoid stale state
        const resolvedUser = savedUser || userName;
        const resolvedPass = savedPass ? atob(savedPass) : password;
        await executeLogin(resolvedUser, resolvedPass);
      } else {
        // Fallback for devices without biometric support or HTTP (not HTTPS)
        const confirmed = await confirmDialog(
          'Fingerprint Authentication',
          'Touch the fingerprint sensor or simulate a scan to continue.',
          { confirmText: 'Simulate Scan', cancelText: 'Cancel' }
        );
        if (confirmed) {
          const savedUser = localStorage.getItem('savedUserName');
          const savedPass = localStorage.getItem('savedPassKey');
          const resolvedUser = savedUser || userName;
          const resolvedPass = savedPass ? atob(savedPass) : password;
          await executeLogin(resolvedUser, resolvedPass);
        }
      }
    } catch (error) {
      console.error(error);
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
         toast.error('Biometric Failed', 'Authentication failed. Please use your password instead.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div
      className="app-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--g-navy)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Navy gradient bg overlay with diamond pattern */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(circle at 15% 85%, rgba(249,115,22,.2) 0%, transparent 45%),
            radial-gradient(circle at 85% 15%, rgba(37,99,168,.4) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M26 0L52 26L26 52L0 26z'/%3E%3C/g%3E%3C/svg%3E")
          `,
        }}
      />

      {/* Card */}
      <div
        className="app-card"
        style={{
          width: '100%',
          maxWidth: 420,
          margin: 0,
          position: 'relative',
          zIndex: 1,
          borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--s-xl)',
          overflow: 'hidden',
        }}
      >
        {/* ── Top branded strip (reuses app-hero styles) ── */}
        <div
          className="app-hero"
          style={{ padding: '28px 28px 44px', marginBottom: 0 }}
        >
          <div className="app-hero-inner" style={{ textAlign: 'center' }}>
            {/* Brand icon */}
            <div
              className="app-icon-box"
              style={{
                width: 52, height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,.15)',
                border: '1.5px solid rgba(255,255,255,.25)',
                margin: '0 auto 14px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <img src="../kinetix-logo.png" alt="Kinetix Logo" style={{ width: 36, height: 36 }} />
              {/* <Heart size={26} color="#fff" strokeWidth={2.5} /> */}
            </div>
            <h1 className="app-hero-title" style={{ fontSize: 22, textAlign: 'center' }}>
              Kinetix Wellness Care
            </h1>
            <p className="app-hero-sub mb-2" style={{ textAlign: 'center' }}>
              {viewMode === 'biometric' && isMobileOrTab
                ? 'Welcome back! Authenticate to continue'
                : 'Patient Portal Access'}
            </p>
          </div>
        </div>

        {/* ── Card Body ── */}
        <div className="app-card-body" style={{ padding: '24px 28px 30px' }}>

          {viewMode === 'biometric' && isMobileOrTab ? (

            /* ── BIOMETRIC VIEW ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                className="app-icon-box app-icon-navy"
                style={{ width: 88, height: 88, borderRadius: 22, marginBottom: 14 }}
              >
                <User size={44} color="var(--c-navy)" />
              </div>

              <p style={{
                fontSize: 17, fontWeight: 800,
                color: 'var(--c-text)', margin: '0 0 4px', textAlign: 'center'
              }}>
                {localStorage.getItem('savedUserName') || 'Patient'}
              </p>
              <p className="app-card-sub" style={{ marginBottom: 24, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                Logged in previously
              </p>

              <button
                type="button"
                className="app-btn-orange"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 'var(--r-sm)', marginBottom: 12 }}
                onClick={handleBiometric}
                disabled={bioLoading}
              >
                {bioLoading
                  ? <CSpinner size="sm" style={{ color: '#fff' }} />
                  : <><Fingerprint size={22} /> Login with Biometrics</>}
              </button>

              <button
                type="button"
                className="app-btn-ghost"
                style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '10px' }}
                onClick={() => setViewMode('form')}
              >
                <ArrowLeft size={15} /> Use password instead
              </button>
            </div>

          ) : (

            /* ── FORM VIEW ── */
            <form onSubmit={handleLogin}>

              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label className="app-info-label" style={{ marginBottom: 6, display: 'block' }}>
                  Username / Patient ID
                </label>
                <div className="app-info-item" style={{
                  padding: '0 14px', borderRadius: 'var(--r-sm)',
                  gap: 10, background: 'var(--c-surface-2)',
                }}>
                  <User
                    size={16}
                    style={{
                      color: 'var(--c-text-3)',
                      flexShrink: 0,
                      alignSelf: 'center'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      padding: '13px 0', fontSize: 14,
                      fontFamily: 'var(--font-body)', color: 'var(--c-text)', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label className="app-info-label" style={{ marginBottom: 6, display: 'block' }}>
                  Security Password
                </label>
                <div className="app-info-item" style={{
                  padding: '0 14px', borderRadius: 'var(--r-sm)',
                  gap: 10, background: 'var(--c-surface-2)',
                }}>
                  <Lock
                    size={16}
                    style={{
                      color: 'var(--c-text-3)',
                      flexShrink: 0,
                      alignSelf: 'center'
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      padding: '13px 0', fontSize: 14,
                      fontFamily: 'var(--font-body)', color: 'var(--c-text)', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    className="app-btn-ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      color: 'var(--c-text-3)',
                      flexShrink: 0,
                      alignSelf: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                className="app-btn-navy"
                style={{
                  width: '100%', justifyContent: 'center',
                  padding: '14px', fontSize: 15, marginTop: 8,
                  borderRadius: 'var(--r-sm)',
                  opacity: loading ? .7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                disabled={loading}
              >
                {loading ? <CSpinner size="sm" style={{ color: '#fff' }} /> : 'Sign In'}
              </button>

              {/* Biometric option — mobile/tab only */}
              {isMobileOrTab && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px',
                  }}>
                    <hr className="app-divider" style={{ flex: 1 }} />
                    <span className="app-card-sub" style={{ textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>
                      or continue with
                    </span>
                    <hr className="app-divider" style={{ flex: 1 }} />
                  </div>

                  <button
                    type="button"
                    className="app-btn-outline-navy"
                    style={{
                      width: '100%', justifyContent: 'center',
                      padding: '13px', fontSize: 13,
                      borderRadius: 'var(--r-sm)',
                      opacity: bioLoading ? .6 : 1,
                    }}
                    onClick={handleBiometric}
                    disabled={bioLoading}
                  >
                    {bioLoading ? <CSpinner size="sm" /> : <><Fingerprint size={18} /> Biometric Access</>}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Footer note */}
          <p className="app-card-sub" style={{
            textAlign: 'center', marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <Heart size={11} color="var(--c-orange)" fill="var(--c-orange)" />
            Secured Patient Portal · Kinetix Wellness
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;