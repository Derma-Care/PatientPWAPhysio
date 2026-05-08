import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser, cilFingerprint } from '@coreui/icons';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import Swal from 'sweetalert2';
import { Fingerprint, Smartphone } from 'lucide-react';

const Login = () => {
  const [userName, setUserName] = useState('000101_CR_00066');
  const [password, setPassword] = useState('9686575675');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({
        userName,
        password,
        deviceId: "doc3O1rkTCKSoTfadDR8ap:APA91bFizh_rYgFk5CcAOjOSajPpzvIApq21uqd7O0DKLbqoUGt7dF_nVLeQXKu4eau9iXYrtp7KmfjDrfbNy5ZsDNwSIC7_2h93zkxA_4ucoJ-kHLKLX7A"
      });

      if (response.success) {
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
    // Simulate biometric authentication
    setTimeout(() => {
      setBioLoading(false);
      Swal.fire({
        title: 'Biometric Login',
        text: 'Authenticate with FaceID / TouchID',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Simulate Success',
      }).then((result) => {
        if (result.isConfirmed) {
          // In a real app, you'd use the WebAuthn API here
          // For demo, we use the default credentials
          handleLogin({ preventDefault: () => {} });
        }
      });
    }, 1000);
  };

  return (
    <div className="min-vh-100 d-flex flex-row align-items-center" style={{ background: '#f8fafc' }}>
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={5}>
            <CCardGroup className="shadow-lg border-0" style={{ borderRadius: '24px', overflow: 'hidden' }}>
              <CCard className="p-4 border-0">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <div className="mb-4 text-center">
                      <h1 className="fw-bold gradient-text">Welcome Back</h1>
                      <p className="text-secondary">Sign in to your Patient Portal</p>
                    </div>
                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light border-0">
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Username"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-light border-0 py-2"
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText className="bg-light border-0">
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-light border-0 py-2"
                        required
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={12}>
                        <CButton 
                          type="submit" 
                          className="btn-premium w-100 mb-3 d-flex align-items-center justify-content-center gap-2" 
                          disabled={loading}
                        >
                          {loading ? <CSpinner size="sm" /> : 'Login'}
                        </CButton>
                      </CCol>
                      <CCol xs={12}>
                        <CButton 
                          color="light" 
                          className="w-100 border-0 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                          onClick={handleBiometric}
                          disabled={bioLoading}
                        >
                          {bioLoading ? <CSpinner size="sm" /> : <><Fingerprint size={18} /> Biometric Login</>}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;
