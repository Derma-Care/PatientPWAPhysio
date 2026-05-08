import React, { useEffect, useState } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
  CButton,
  CImage,
  CBadge,
  CAvatar,
} from '@coreui/react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  ExternalLink,
  Award,
  Navigation,
  PlayCircle,
  ChevronRight
} from 'lucide-react';
import CIcon from '@coreui/icons-react';
import { cibFacebook, cibTwitter, cibInstagram } from '@coreui/icons';
import { clinicService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ClinicDetails = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        if (user?.hospitalId) {
          const response = await clinicService.getClinic(user.hospitalId);
          setClinic(response.data);
        }
      } catch (error) {
        console.error('Error fetching clinic details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  return (
    <div className="fade-in pb-5">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Clinic Details</h2>
        <p className="text-secondary small">Comprehensive information about our medical facilities and services</p>
      </div>

      <CRow>
        <CCol lg={8} className="mb-4">
          <CCard className="premium-card border-0 overflow-hidden mb-4 shadow-sm" style={{ background: '#fff' }}>
            <div className="position-relative" style={{ height: '220px', background: 'var(--primary-gradient)' }}>
              <div className="position-absolute w-100 h-100" style={{ background: 'url(https://www.transparenttextures.com/patterns/carbon-fibre.png)', opacity: '0.05' }}></div>
              <div className="position-absolute bottom-0 start-0 p-4 w-100 d-flex justify-content-between align-items-end">
                <div className="d-flex align-items-center gap-4">
                  <div className="bg-white p-2 rounded-4 shadow-lg" style={{ width: '110px', height: '110px' }}>
                    <CImage
                      src={(() => {
                        const logo = clinic?.hospitalLogo || clinic?.clinicLogo;
                        if (!logo) return "https://ui-avatars.com/api/?name=Kinetix&background=fff&color=1B4F8A";
                        if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
                        return `data:image/png;base64,${logo}`;
                      })()}
                      className="w-100 h-100 object-fit-contain"
                    />
                  </div>
                  <div className="text-white">
                    <h1 className="fw-bold m-0 text-white" style={{ letterSpacing: '-0.5px' }}>{clinic?.name}</h1>
                    <div className="d-flex align-items-center gap-2 small opacity-90 mt-1">
                      <MapPin size={16} className="text-orange" /> {clinic?.address}
                    </div>
                  </div>
                </div>
                <div className="pb-1 d-none d-md-block">
                  <CBadge color="light" className="text-primary py-2 px-3 fw-bold rounded-pill shadow-sm">
                    {clinic?.subscription || 'Verified'} Clinic
                  </CBadge>
                </div>
              </div>
            </div>
            <CCardBody className="p-4 pt-5">
              <CRow className="g-5">
                <CCol md={6}>
                  <div className="mb-4">
                    <h6 className="fw-bold text-primary text-uppercase small" style={{ letterSpacing: '1px' }}>Contact Details</h6>
                    <hr className="mt-2 mb-0 opacity-10" style={{ width: '40px', height: '3px', background: 'var(--primary-color)' }} />
                  </div>
                  <div className="d-flex flex-column gap-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><Phone size={18} /></div>
                      <div>
                        <div className="small text-secondary">Phone Support</div>
                        <div className="fw-bold text-dark">{clinic?.contactNumber}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><Mail size={18} /></div>
                      <div>
                        <div className="small text-secondary">Email Address</div>
                        <div className="fw-bold text-dark">{clinic?.emailAddress}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><Globe size={18} /></div>
                      <div>
                        <div className="small text-secondary">Official Website</div>
                        <a href={clinic?.website} target="_blank" rel="noreferrer" className="fw-bold text-primary text-decoration-none hover-underline">
                          {clinic?.website?.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-4">
                    <h6 className="fw-bold text-primary text-uppercase small" style={{ letterSpacing: '1px' }}>Facility Information</h6>
                    <hr className="mt-2 mb-0 opacity-10" style={{ width: '40px', height: '3px', background: 'var(--primary-color)' }} />
                  </div>
                  <div className="d-flex flex-column gap-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><Clock size={18} /></div>
                      <div>
                        <div className="small text-secondary">Operational Hours</div>
                        <div className="fw-bold text-dark">{clinic?.openingTime} - {clinic?.closingTime}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><ShieldCheck size={18} /></div>
                      <div>
                        <div className="small text-secondary">Registration Number</div>
                        <div className="fw-bold text-dark">{clinic?.licenseNumber}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded-3 text-primary"><Award size={18} /></div>
                      <div>
                        <div className="small text-secondary">NABH Score</div>
                        <div className="fw-bold text-dark d-flex align-items-center gap-2">
                          {clinic?.nabhScore} / 10 <CBadge color="success" className="bg-opacity-10 text-success small">Verified</CBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          <h5 className="fw-bold text-dark mb-4 mt-5 d-flex align-items-center gap-2">
            <span className="bg-primary rounded-pill" style={{ width: '4px', height: '20px' }}></span>
            Active Branch Locations
          </h5>
          <CRow>
            {clinic?.branches?.map((branch, idx) => (
              <CCol md={6} key={idx} className="mb-4">
                <CCard className="premium-card border-0 h-100 shadow-sm">
                  <CCardBody className="p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="bg-light p-3 rounded-4">
                        <MapPin size={24} className="text-primary" />
                      </div>
                      <CButton 
                        color="warning" 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-pill fw-bold text-orange d-flex align-items-center gap-1 px-3"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`, '_blank')}
                      >
                        Navigate <Navigation size={14} />
                      </CButton>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">{branch.branchName}</h5>
                    <p className="small text-secondary mb-4 flex-grow-1">{branch.address}</p>
                    <div className="d-flex flex-column gap-2 border-top pt-3">
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <Phone size={14} /> <span>{branch.contactNumber}</span>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>
        </CCol>

        <CCol lg={4}>
          <CCard className="premium-card border-0 mb-4 p-4 shadow-sm" style={{ background: '#fff' }}>
            <h6 className="fw-bold text-primary text-uppercase small mb-4" style={{ letterSpacing: '1px' }}>Social Presence</h6>
            <div className="d-flex flex-column gap-3">
              <a href="#" className="text-decoration-none d-flex align-items-center justify-content-between p-3 rounded-4 border premium-social-link">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 text-danger"><CIcon icon={cibInstagram} size="lg" /></div>
                  <div>
                    <div className="fw-bold text-dark small">Instagram</div>
                    <div className="small text-secondary">@kinetixwellness</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-secondary" />
              </a>
              <a href="#" className="text-decoration-none d-flex align-items-center justify-content-between p-3 rounded-4 border premium-social-link">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 text-info"><CIcon icon={cibTwitter} size="lg" /></div>
                  <div>
                    <div className="fw-bold text-dark small">Twitter</div>
                    <div className="small text-secondary">@kinetixcare</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-secondary" />
              </a>
              <a href="#" className="text-decoration-none d-flex align-items-center justify-content-between p-3 rounded-4 border premium-social-link">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3 text-primary"><CIcon icon={cibFacebook} size="lg" /></div>
                  <div>
                    <div className="fw-bold text-dark small">Facebook</div>
                    <div className="small text-secondary">Kinetix Wellness</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-secondary" />
              </a>
            </div>
          </CCard>

          <CCard className="premium-card border-0 mb-4 p-4 shadow-sm overflow-hidden">
            <h6 className="fw-bold text-primary text-uppercase small mb-4" style={{ letterSpacing: '1px' }}>Virtual Experience</h6>
            <div className="position-relative rounded-4 overflow-hidden mb-3" style={{ height: '180px' }}>
              <CImage src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" className="w-100 h-100 object-fit-cover" />
              <div className="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-20">
                <CButton 
                  color="white" 
                  className="rounded-circle p-3 shadow-lg pulse-animation"
                  onClick={() => clinic?.walkthrough && window.open(clinic.walkthrough, '_blank')}
                >
                  <PlayCircle size={32} className="text-primary" />
                </CButton>
              </div>
            </div>
            <CButton 
              color="primary" 
              className="w-100 rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm btn-premium" 
              onClick={() => clinic?.walkthrough && window.open(clinic.walkthrough, '_blank')}
            >
              Start 360° Tour <ExternalLink size={16} />
            </CButton>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default ClinicDetails;
