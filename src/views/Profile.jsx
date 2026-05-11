import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
  CButton,
  CAvatar,
  CFormInput,
  CFormLabel,
  CBadge,
} from '@coreui/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Edit2,
  Save,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(localStorage.getItem('profilePicture'));
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.customerId) {
          const response = await customerService.getProfile(user.customerId);
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPreviewImage(base64String);
        localStorage.setItem('profilePicture', base64String);
        Swal.fire({
          icon: 'info',
          title: 'Uploading...',
          text: 'Saving your new profile picture',
          timer: 1500,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading()
        }).then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Profile picture updated!',
            timer: 1500,
            showConfirmButton: false
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = () => {
    setEditing(false);
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated',
      text: 'Your profile has been successfully updated.',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

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
          <h2 className="fw-bold text-dark m-0">My Profile</h2>
          <p className="text-secondary m-0">Manage your personal information and account settings</p>
        </div>
      </div>

      <CRow>
        <CCol lg={4} className="mb-4">
          <CCard className="premium-card border-0 text-center">
            <CCardBody className="p-4">
              <div className="position-relative d-inline-block mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <CAvatar
                  src={previewImage || `https://ui-avatars.com/api/?name=${profile?.fullName}&background=1B4F8A&color=fff`}
                  size="xl"
                  className="shadow border border-4 border-white"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
                <CButton
                  color="primary"
                  className="position-absolute bottom-0 end-0 rounded-circle p-2 shadow-sm border-0"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary-color)' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera size={18} />
                </CButton>
              </div>
              <h4 className="fw-bold text-dark mb-1">{profile?.fullName}</h4>
              <p className="text-secondary small mb-4">Patient ID: {profile?.patientId}</p>

              <div className="d-flex justify-content-center gap-2 mb-4">
                <CBadge color="info" shape="pill" className="px-3 py-2 bg-opacity-10 text-primary fw-bold">
                  Premium Member
                </CBadge>
                <CBadge color="success" shape="pill" className="px-3 py-2 bg-opacity-10 text-success fw-bold">
                  Verified
                </CBadge>
              </div>

              <div className="border-top pt-4">
                <div className="d-flex justify-content-between text-start mb-3">
                  <span className="text-secondary small">Member Since</span>
                  <span className="fw-bold small">{new Date(profile?.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="d-flex justify-content-between text-start">
                  <span className="text-secondary small">Referral Code</span>
                  <span className="fw-bold text-primary small">{profile?.referralCode}</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={8}>
          <CCard className="premium-card border-0">
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2">
                  <User size={20} className="text-primary" /> Personal Information
                </h5>
                <div className="d-flex gap-2">
                  {editing && (
                    <CButton
                      color="light"
                      className="rounded-3 fw-bold border"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </CButton>
                  )}
                  <CButton
                    style={{ backgroundColor: "var(--primary-color)", color: "white" }}
                    className="rounded-3 fw-bold d-flex align-items-center gap-2 border-0"
                    onClick={() => editing ? handleUpdate() : setEditing(true)}
                  >
                    {editing ? <><Save size={18} /> Save Changes</> : <><Edit2 size={18} /> Edit</>}
                  </CButton>
                </div>
              </div>

              <CRow className="g-4 mb-5">
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Full Name</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.fullName} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Gender</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.gender} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Date of Birth</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.dateOfBirth} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Email Address</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.email || 'N/A'} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Mobile Number</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.mobileNumber} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Age</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.age} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                </CCol>
              </CRow>

              <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                <MapPin size={20} className="text-primary" /> Contact Address
              </h5>
              <CRow className="g-4">
                <CCol md={12}>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Full Address</CFormLabel>
                    <CFormInput disabled={!editing} value={`${profile?.address?.houseNo}, ${profile?.address?.street}, ${profile?.address?.landmark}, ${profile?.address?.city}, ${profile?.address?.state}, ${profile?.address?.postalCode}`} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">City</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.address?.city} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel className="text-secondary small fw-bold">Postal Code</CFormLabel>
                    <CFormInput disabled={!editing} value={profile?.address?.postalCode} className="bg-light border-0 py-2 fw-semibold" />
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default Profile;
