import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CContainer, CHeader, CHeaderBrand, CHeaderNav, CNavItem, CNavLink,
  CSidebar, CSidebarBrand, CSidebarNav, CHeaderToggler,
  CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
  CDropdownDivider, CAvatar, CDropdownHeader, CImage,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilHome, cilCalendarCheck, cilUser, cilHospital, cilMenu, cilHistory } from '@coreui/icons';
import { useAuth } from '../context/AuthContext';
import { clinicService } from '../services/api';
import { LogOut, User, Settings, Bell, Activity, ChevronRight, Calendar } from 'lucide-react';
import { confirmDialog } from '../utils/toast';
import { useNotifications } from '../context/NotificationContext';

/* ── nav items config ─────────────────────────────────────────────────────── */
const NAV = [
  { to: '/dashboard', icon: cilHome, label: 'Dashboard' },
  { to: '/bookings', icon: cilCalendarCheck, label: 'My Bookings' },
  { to: '/profile', icon: cilUser, label: 'Profile' },
  { to: '/clinic', icon: cilHospital, label: 'Clinic Details' },
];

const DefaultLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = React.useState(true);
  const { unreadCount } = useNotifications();
  const [clinic, setClinic] = React.useState(null);
  const [userProfilePic, setUserProfilePic] = React.useState(
    () => localStorage.getItem('profilePicture')
  );

  React.useEffect(() => {
    const fetchClinic = async () => {
      if (user?.hospitalId) {
        try {
          const response = await clinicService.getClinic(user.hospitalId);
          localStorage.setItem('selectedHospital', JSON.stringify(response.data))

          setClinic(response.data);
        } catch (error) {
          console.error('Error fetching clinic info:', error);
        }
      }
    };
    fetchClinic();

    const handleStorageChange = () => setUserProfilePic(localStorage.getItem('profilePicture'));
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(interval); };
  }, [user]);

  const handleLogout = async () => {
    const confirmed = await confirmDialog(
      'Logout',
      'Are you sure you want to log out?',
      { confirmText: 'Yes, Log Out', cancelText: 'Cancel', danger: true }
    );
    if (confirmed) {
      // Preserve persistent settings
      const bioEnabled = localStorage.getItem('biometricEnabled');
      const bioCredId = localStorage.getItem('bioCredId');
      const savedUser = localStorage.getItem('savedUserName');
      const savedPass = localStorage.getItem('savedPassKey');
      const clinic = localStorage.getItem('selectedClinic');

      localStorage.clear();

      if (bioEnabled) localStorage.setItem('biometricEnabled', bioEnabled);
      if (bioCredId) localStorage.setItem('bioCredId', bioCredId);
      if (savedUser) localStorage.setItem('savedUserName', savedUser);
      if (savedPass) localStorage.setItem('savedPassKey', savedPass);
      if (clinic) localStorage.setItem('selectedClinic', clinic);

      sessionStorage.clear();
      logout();
      navigate('/login');
    }
  };
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setVisible(false);
    }
  };

  const logoSrc = (() => {
    const logo = clinic?.hospitalLogo || clinic?.clinicLogo;
    if (!logo) return null;
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
    return `data:image/png;base64,${logo}`;
  })();

  const avatarSrc = userProfilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.customerName ?? 'P')}&background=1B4F8A&color=fff`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--c-surface-2)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <CSidebar
        position="fixed"
        unfoldable={false}
        visible={visible}
        onVisibleChange={setVisible}
        style={{
          width: 256,
          background: 'var(--c-surface)',
          borderRight: '1px solid var(--c-border)',
          boxShadow: 'var(--s-md)',
          zIndex: 1030,
        }}
      >
        {/* Brand */}
        <CSidebarBrand style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--c-border)',
          background: 'var(--c-surface)',
          textDecoration: 'none',
          display: 'block',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Accent icon */}
            {/* <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'var(--g-navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--s-navy)',
            }}>
              <Activity size={20} color="#fff" />
            </div> */}
            <div>
              <div style={{
                fontWeight: 800, fontSize: 17,
                color: 'var(--c-text)', lineHeight: 1.15, letterSpacing: '-.3px',
              }}>
                {clinic?.name?.split(' ')[0] || 'PhysioElite'}
                <span style={{ color: 'var(--c-navy)', fontWeight: 700 }}>
                  {' '}{clinic?.name?.split(' ').slice(1).join(' ')}
                </span>
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '1.8px',
                textTransform: 'uppercase', color: 'var(--c-text-3)', marginTop: 2,
              }}>
                Patient Portal
              </div>
            </div>
          </div>
        </CSidebarBrand>

        {/* Nav links */}
        <CSidebarNav style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon, label }) => (
            <CNavItem key={to}>
              <NavLink
                to={to}
                onClick={handleLinkClick}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--r-sm)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 14,
                  transition: 'all .18s',
                  background: isActive ? 'var(--c-navy-xlight)' : 'transparent',
                  color: isActive ? 'var(--c-navy)' : 'var(--c-text-2)',
                  borderLeft: isActive ? '3px solid var(--c-navy)' : '3px solid transparent',
                })}
              >
                <CIcon
                  icon={icon}
                  style={{ width: 18, height: 18, flexShrink: 0, opacity: .85 }}
                />
                <span style={{ flex: 1 }}>{label}</span>
              </NavLink>
            </CNavItem>
          ))}

          {/* Logout at bottom */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--c-border)' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 'var(--r-sm)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                color: 'var(--c-danger)', transition: 'background .18s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--c-danger-light)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </CSidebarNav>
      </CSidebar>

      {/* ── Main wrapper ───────────────────────────────────────────────────── */}
      <div style={{
        paddingLeft: (visible && window.innerWidth >= 992) ? 256 : 0,
        transition: 'padding .3s ease-in-out',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <CHeader style={{
          position: 'sticky', top: 0, zIndex: 1020,
          background: 'var(--c-surface)',
          borderBottom: '1px solid var(--c-border)',
          boxShadow: 'var(--s-sm)',
          marginBottom: 0,
        }}>
          <CContainer fluid style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>

            {/* Left: toggle + greeting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CHeaderToggler onClick={() => setVisible(!visible)} style={{ color: 'var(--c-text-2)', cursor: 'pointer' }}>
                <CIcon icon={cilMenu} style={{ width: 22, height: 22 }} />
              </CHeaderToggler>
              <div className="stat-name">
                <p style={{ margin: 0, fontSize: 14, color: 'var(--c-text-2)', fontWeight: 500 }}>
                  Welcome back,{' '}
                  <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>
                    {user?.customerName || 'Patient'}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: bell + avatar dropdown */}
            <CHeaderNav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Bell → navigates to /notifications */}
              <CNavItem>
                <div
                  role="button"
                  onClick={() => navigate('/notifications')}
                  style={{
                    width: 38, height: 38, borderRadius: 'var(--r-sm)',
                    background: 'var(--c-surface-2)', border: '1px solid var(--c-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative'
                  }}
                >
                  <Bell size={17} color="var(--c-text-2)" />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 5, right: 7, width: 9, height: 9,
                      background: '#ef4444', borderRadius: '50%',
                      boxShadow: '0 0 0 2px var(--c-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 6, color: '#fff', fontWeight: 800
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </CNavItem>

              {/* Avatar + dropdown */}
              <CDropdown variant="nav-item">
                <CDropdownToggle className="py-0 pe-0" caret={false} style={{ background: 'none', border: 'none' }}>
                  {userProfilePic ? (
                    <img
                      src={userProfilePic}
                      alt="avatar"
                      style={{
                        width: 40, height: 40, borderRadius: 12, objectFit: 'cover',
                        border: '2px solid var(--c-navy-light)', cursor: 'pointer'
                      }}
                    />
                  ) : logoSrc ? (
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: 'var(--c-surface)',
                      border: '2px solid var(--c-navy-light)', padding: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <CImage src={logoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
                      background: 'var(--g-navy)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: '#fff', fontSize: 16,
                    }}>
                      {user?.customerName?.charAt(0) || 'P'}
                    </div>
                  )}
                </CDropdownToggle>

                <CDropdownMenu style={{
                  borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)',
                  boxShadow: 'var(--s-xl)', minWidth: 230, padding: 0,
                  overflow: 'hidden', marginTop: 10,
                }}>
                  {/* User info header */}
                  <CDropdownHeader style={{
                    background: 'var(--g-navy)', padding: '16px 18px',
                    borderBottom: 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={avatarSrc}
                        alt="avatar"
                        style={{
                          width: 42, height: 42, borderRadius: 10, objectFit: 'cover',
                          border: '2px solid rgba(255,255,255,.3)'
                        }}
                      />
                      <div>
                        <p style={{
                          margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.6)',
                          textTransform: 'uppercase', letterSpacing: '.6px'
                        }}>Logged in as</p>
                        <p style={{
                          margin: 0, fontWeight: 800,
                          color: '#fff', fontSize: 14, maxWidth: 130,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {user?.customerName}
                        </p>
                      </div>
                    </div>
                  </CDropdownHeader>

                  <div style={{ padding: 8 }}>
                    {[
                      { icon: User, label: 'My Profile', action: () => navigate('/profile') },
                      { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
                    ].map(({ icon: Icon, label, action }) => (
                      <CDropdownItem key={label} onClick={action} style={{
                        borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        color: 'var(--c-text)',
                      }}>
                        <Icon size={15} style={{ color: 'var(--c-navy)' }} /> {label}
                      </CDropdownItem>
                    ))}

                    <CDropdownDivider style={{ margin: '6px 0', borderColor: 'var(--c-border)' }} />

                    <CDropdownItem onClick={handleLogout} style={{
                      borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      color: 'var(--c-danger)',
                    }}>
                      <LogOut size={15} /> Logout
                    </CDropdownItem>
                  </div>
                </CDropdownMenu>
              </CDropdown>
            </CHeaderNav>
          </CContainer>
        </CHeader>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer style={{
          padding: '14px 24px', textAlign: 'center', fontSize: 12,
          color: 'var(--c-text-3)', borderTop: '1px solid var(--c-border)',
          background: 'var(--c-surface)', fontWeight: 500,
        }}>
          © {new Date().getFullYear()} {clinic?.name || 'PhysioElite'}. All rights reserved.
        </footer>
        {/* ── Floating Action Button ────────────────────────────────────────── */}
        {!['/book-appointment', '/follow-up-booking'].includes(location.pathname) && (
          <button
            onClick={() => navigate('/book-appointment')}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 20px',
              borderRadius: 30,
              background: 'var(--g-navy-soft)',
              color: '#fff',
              border: 'none',
              boxShadow: 'var(--s-xl)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Calendar size={18} />
            <span className="d-none d-sm-inline">Book Appointment</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DefaultLayout;