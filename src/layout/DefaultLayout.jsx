import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CNavItem,
  CNavLink,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CHeaderToggler,
  CCollapse,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CAvatar,
  CDropdownHeader,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilHome,
  cilCalendarCheck,
  cilUser,
  cilHospital,
  cilMenu,
  cilAccountLogout,
  cilHistory,
} from '@coreui/icons';
import { useAuth } from '../context/AuthContext';
import { clinicService } from '../services/api';
import { LogOut, User, Settings, Bell, Activity } from 'lucide-react';
import { CImage } from '@coreui/react';

const DefaultLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = React.useState(true);
  const [clinic, setClinic] = React.useState(null);

  React.useEffect(() => {
    const fetchClinic = async () => {
      if (user?.hospitalId) {
        try {
          const response = await clinicService.getClinic(user.hospitalId);
          setClinic(response.data);
        } catch (error) {
          console.error('Error fetching clinic info:', error);
        }
      }
    };
    fetchClinic();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setVisible(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <CSidebar
        className="border-end glass-morphism shadow-sm"
        position="fixed"
        unfoldable={false}
        visible={visible}
        onVisibleChange={(val) => setVisible(val)}
        narrow={false}
        backdrop={undefined}
      >
        <CSidebarBrand className="d-flex align-items-center p-4 bg-white border-0 text-decoration-none border-bottom border-light">
          <div className="d-flex align-items-center gap-3  ">
            {/* <div className="bg-primary bg-opacity-10 p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
              <Activity size={22} className="text-primary" />
            </div> */}
            <div className="d-flex flex-column py-1 text-decoration-none">
              <span
                className="fw-bolder text-dark m-0 text-decoration-none"
                style={{
                  fontSize: '2.0rem',
                  lineHeight: '1.1',
                  letterSpacing: '-0.5px',
                }}
              >
                {clinic?.name?.split(' ')[0] || 'Kinetix'}
                <div className="text-primary" style={{ fontSize: '1rem' }}>{clinic?.name?.split(' ').slice(1).join(' ') || 'Wellness'}</div>
              </span>
              <span className="small text-secondary fw-bold text-uppercase mt-1" style={{ fontSize: '0.6rem', letterSpacing: '1.5px', opacity: 0.7 }}>
                Patient Portal
              </span>
            </div>
          </div>
        </CSidebarBrand>
        <CSidebarNav className="p-3 gap-2">
          <CNavItem>
            <NavLink to="/dashboard" className="nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 transition-all hover-bg-light" onClick={handleLinkClick}>
              <CIcon icon={cilHome} className="nav-icon text-primary opacity-75" />
              <span className="fw-semibold">Dashboard</span>
            </NavLink>
          </CNavItem>
          <CNavItem>
            <NavLink to="/bookings" className="nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 transition-all hover-bg-light" onClick={handleLinkClick}>
              <CIcon icon={cilCalendarCheck} className="nav-icon text-primary opacity-75" />
              <span className="fw-semibold">My Bookings</span>
            </NavLink>
          </CNavItem>
          <CNavItem>
            <NavLink to="/profile" className="nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 transition-all hover-bg-light" onClick={handleLinkClick}>
              <CIcon icon={cilUser} className="nav-icon text-primary opacity-75" />
              <span className="fw-semibold">Profile</span>
            </NavLink>
          </CNavItem>
          <CNavItem>
            <NavLink to="/clinic" className="nav-link d-flex align-items-center gap-3 py-2 px-3 rounded-3 transition-all hover-bg-light" onClick={handleLinkClick}>
              <CIcon icon={cilHospital} className="nav-icon text-primary opacity-75" />
              <span className="fw-semibold">Clinic Details</span>
            </NavLink>
          </CNavItem>
        </CSidebarNav>
      </CSidebar>

      <div
        className="wrapper d-flex flex-column min-vh-100"
        style={{
          paddingLeft: (visible && window.innerWidth >= 992) ? '256px' : '0',
          transition: 'padding 0.3s ease-in-out',
        }}
      >
        <CHeader className="mb-4 glass-morphism sticky-top border-bottom-0 shadow-sm" style={{ height: '70px' }}>
          <CContainer fluid className="px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <CHeaderToggler
                className="ps-1"
                onClick={() => setVisible(!visible)}
              >
                <CIcon icon={cilMenu} size="lg" />
              </CHeaderToggler>
              <h4 className="m-0 fw-bold d-none d-md-block text-secondary">
                Welcome, <span className="text-dark">{user?.customerName || 'Patient'}</span>
              </h4>
            </div>

            <CHeaderNav className="ms-auto d-flex align-items-center gap-3">
              <CNavItem>
                <CNavLink href="#" className="p-0">
                  <Bell size={20} className="text-secondary opacity-75" />
                </CNavLink>
              </CNavItem>

              <CDropdown variant="nav-item">
                <CDropdownToggle className="py-0 pe-0 d-flex align-items-center no-caret" caret={false}>
                  {(clinic?.hospitalLogo || clinic?.clinicLogo) ? (
                    <div
                      className="shadow-sm transition-all hover-scale cursor-pointer"
                      style={{
                        width: '45px',
                        height: '45px',
                        background: 'white',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '6px',
                        border: '1px solid #eef2f6'
                      }}
                    >
                      <CImage
                        src={(() => {
                          const logo = clinic.hospitalLogo || clinic.clinicLogo;
                          if (!logo) return null;
                          if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
                          return `data:image/png;base64,${logo}`;
                        })()}
                        className="w-100 h-100 object-fit-contain"
                      />
                    </div>
                  ) : (
                    <CAvatar color="primary" textColor="white" className="fw-bold cursor-pointer" style={{ width: '45px', height: '45px', borderRadius: '12px' }}>
                      {clinic?.name?.charAt(0) || 'K'}
                    </CAvatar>
                  )}
                </CDropdownToggle>
                <CDropdownMenu className="pt-0 shadow-lg border-0 mt-3" placement="bottom-end" style={{ borderRadius: '16px', minWidth: '220px' }}>
                  <CDropdownHeader className="bg-light fw-bold py-3 text-dark rounded-top-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-3">
                      <CAvatar color="primary" size="md" className="fw-bold">{user?.customerName?.charAt(0) || 'P'}</CAvatar>
                      <div className="d-flex flex-column">
                        <span className="small text-secondary fw-semibold">Logged in as</span>
                        <span className="text-dark fw-bold text-truncate" style={{ maxWidth: '120px' }}>{user?.customerName}</span>
                      </div>
                    </div>
                  </CDropdownHeader>
                  <div className="p-2">
                    <CDropdownItem
                      className="rounded-3 py-2 d-flex align-items-center"
                      onClick={() => navigate('/profile')}
                      style={{ cursor: 'pointer' }}
                    >
                      <User size={18} className="me-2 text-primary" /> My Profile
                    </CDropdownItem>
                    <CDropdownItem className="rounded-3 py-2 d-flex align-items-center" onClick={() => navigate('/settings')}>
                      <Settings size={18} className="me-2 text-primary" /> Settings
                    </CDropdownItem>
                    <CDropdownDivider className="my-2" style={{ borderColor: '#f1f5f9' }} />
                    <CDropdownItem
                      className="rounded-3 py-2 d-flex align-items-center text-danger fw-semibold"
                      onClick={handleLogout}
                      style={{ cursor: 'pointer' }}
                    >
                      <LogOut size={18} className="me-2" /> Logout
                    </CDropdownItem>
                  </div>
                </CDropdownMenu>
              </CDropdown>
            </CHeaderNav>
          </CContainer>
        </CHeader>

        <CContainer fluid className="px-4 pb-4 flex-grow-1">
          <Outlet />
        </CContainer>

        <footer className="footer px-4 py-3 text-center text-secondary small">
          <div>
            &copy; {new Date().getFullYear()} Kinetix Wellness Care. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DefaultLayout;
