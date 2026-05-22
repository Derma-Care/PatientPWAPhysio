import React, { useEffect, useState } from 'react';
import { CRow, CCol } from '@coreui/react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronRight,
  Stethoscope,
  Activity,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── Status helpers ──────────────────────────────────────────── */
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'in-progress': return 'app-status-in-progress';
    case 'confirmed': return 'app-status-confirmed';
    case 'completed': return 'app-status-completed';
    default: return 'app-status-default';
  }
};

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (user?.customerId) {
          const response = await customerService.getBookings(user.customerId);
          setBookings(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const filteredBookings = bookings.filter((booking) => {
    const doctorName = booking?.doctorName || '';
    const bookingId = booking?.bookingId || '';
    const branchname = booking?.branchname || '';

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      doctorName.toLowerCase().includes(search) ||
      bookingId.toLowerCase().includes(search) ||
      branchname.toLowerCase().includes(search);

    const isCompleted =
      booking?.status?.toLowerCase() === 'completed';

    const matchesTab =
      activeTab === 'completed'
        ? isCompleted
        : !isCompleted;

    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="app-loading">
        <img src="/favicon.png" className="logo-spinner-grow" alt="Loading..." />
      </div>
    );
  }

  const ongoingCount = bookings.filter(b => b.status?.toLowerCase() !== 'completed').length;
  const completedCount = bookings.filter(b => b.status?.toLowerCase() === 'completed').length;

  return (
    <div className="app-page">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'rgba(249,115,22,0.25)', border: '1px solid rgba(249,115,22,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Activity size={17} color="#fdba74" />
                </div>
                <h2 className="app-hero-title" style={{ margin: 0 }}>My Bookings</h2>
              </div>
              <p className="app-hero-sub">Track your appointments and treatment history</p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', minWidth: '260px', maxWidth: '320px', width: '100%' }}>
              <Search size={15} style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', zIndex: 2,
              }} />
              <input
                type="text"
                placeholder="Search doctor, branch, ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 'var(--r-pill)',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onFocus={e => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                }}
                onBlur={e => {
                  e.target.style.background = 'rgba(255,255,255,0.12)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="app-body" style={{ marginTop: '-32px' }}>

        {/* Tab Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-lg)',
              padding: '4px',
              gap: '4px',
              boxShadow: 'var(--s-md)',
              position: 'sticky',
              top: '16px',
              zIndex: 99,
              width: '100%',
              maxWidth: '450px',
            }}
          >
            {[
              { key: 'ongoing', label: 'Ongoing', count: ongoingCount },
              { key: 'completed', label: 'Completed', count: completedCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '8px 22px',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background:
                    activeTab === tab.key
                      ? 'var(--g-navy-soft)'
                      : 'transparent',
                  color:
                    activeTab === tab.key
                      ? '#fff'
                      : 'var(--c-primary)',
                  boxShadow:
                    activeTab === tab.key
                      ? 'var(--s-navy)'
                      : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}

                <span
                  style={{
                    background:
                      activeTab === tab.key
                        ? 'rgba(255,255,255,0.22)'
                        : 'var(--c-surface-3)',
                    color:
                      activeTab === tab.key
                        ? '#fff'
                        : 'var(--c-primary)',
                    borderRadius: 'var(--r-pill)',
                    padding: '1px 8px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <CRow className="g-3">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking, idx) => (
              <CCol lg={6} key={idx}>
                <BookingCard booking={booking} onClick={() => navigate(`/bookings/${booking.bookingId}`)} />
              </CCol>
            ))
          ) : (
            <CCol xs={12}>
              <div className="app-empty" style={{ padding: '60px 16px' }}>
                <Filter size={52} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--c-text)', margin: '0 0 6px' }}>
                  No bookings found
                </p>
                <p style={{ fontSize: '13px', margin: 0 }}>Try a different doctor name, branch, or booking ID</p>
              </div>
            </CCol>
          )}
        </CRow>

      </div>
    </div>
  );
};

/* ── Compact Booking Card ────────────────────────────────────── */
const BookingCard = ({ booking, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="app-booking-item"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? 'var(--s-lg)' : 'var(--s-sm)',
        borderColor: hovered ? 'var(--c-navy-light)' : 'var(--c-border)',
        transition: 'all 0.2s',
      }}
    >
      {/* ── Row 1: Doctor + Status ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0 }}>
            <Stethoscope size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--c-text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {booking.doctorName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--c-text-3)', fontWeight: 600, marginTop: '1px' }}>
              #{booking.bookingId}
            </div>
          </div>
        </div>

        <span
          className={`app-booking-chip ${getStatusClass(booking.status)}`}
          style={{ flexShrink: 0, fontSize: '11px', color: 'var(--c-primary)' }}
        >
          {booking.status}
        </span>
      </div>

      {/* ── Row 2: Meta info ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--c-surface-2)',
        border: '1px solid var(--c-border-light)',
        borderRadius: 'var(--r-sm)',
        padding: '9px 12px',
        marginBottom: '10px',
      }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <Calendar size={13} color="var(--c-navy)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date & Time</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {booking.serviceDate} {booking.servicetime}
            </div>
          </div>
        </div>

        {/* <div style={{ width: '1px', height: '26px', background: 'var(--c-border)', flexShrink: 0 }} /> */}

        {/* Time */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Clock size={13} color="var(--c-orange)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Time</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text)' }}>{booking.servicetime}</div>
          </div>
        </div> */}

        <div style={{ width: '1px', height: '26px', background: 'var(--c-border)', flexShrink: 0 }} />

        {/* Branch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <MapPin size={13} color="var(--c-navy)" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Branch</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {booking.branchname || "Home Visit"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Visits + CTA ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: 'var(--g-navy-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '12px', fontWeight: 800, color: '#fff',
          }}>
            {booking.visitCount || '1'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--c-text-3)', fontWeight: 600 }}>Total Visits</span>
        </div>

        <button className="app-link-btn" style={{ fontSize: '12px' }}>
          View Details
          <ChevronRight
            size={14}
            style={{ transition: 'transform 0.2s', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}
          />
        </button>
      </div>
    </div>
  );
};

export default Bookings;