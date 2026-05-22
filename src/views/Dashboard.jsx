import React, { useEffect, useState } from 'react';
import { CRow, CCol } from '@coreui/react';
import {
  Calendar, Clock, Activity, ArrowRight,
  ChevronRight, TrendingUp, FileText, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/theme.css'; // ← shared theme

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.customerId) {
          const response = await customerService.getBookings(user.customerId);
          setBookings(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  /* ── helpers (logic unchanged) ── */
  const parseServiceDate = (dateStr) => {
    if (!dateStr) return { month: 'N/A', day: '--' };
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return {
        month: date.toLocaleString('en-US', { month: 'short' }),
        day: date.getDate(),
      };
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return { month: parts[1].substring(0, 3).toUpperCase(), day: parts[0] };
    }
    return { month: 'DATE', day: '??' };
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'in-progress': return { bg: 'var(--c-info-light)', text: 'var(--c-info)' };
      case 'confirmed': return { bg: 'var(--c-navy-xlight)', text: 'var(--c-navy)' };
      case 'completed': return { bg: 'var(--c-purple-light)', text: 'var(--c-purple)' };
      case 'pending': return { bg: 'var(--c-orange-light)', text: 'var(--c-orange)' };
      default: return { bg: 'var(--c-surface-3)', text: 'var(--c-text-3)' };
    }
  };

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'var(--c-navy)', iconBg: 'var(--c-navy-xlight)', accent: 'navy' },
    { label: 'Active Sessions', value: bookings.filter(b => b.status === 'in-progress').length, icon: Activity, color: 'var(--c-orange)', iconBg: 'var(--c-orange-light)', accent: 'orange' },
    { label: 'Upcoming Visits', value: bookings.filter(b => b.status === 'confirmed').length, icon: Clock, color: 'var(--c-info)', iconBg: 'var(--c-info-light)', accent: 'sky' },
    { label: 'Total Reports', value: 0, icon: FileText, color: 'var(--c-danger)', iconBg: 'var(--c-danger-light)', accent: 'rose' },
  ];

  /* ── loading ── */
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-ring" />
        <p className="app-loading-text">Loading dashboard…</p>
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="app-page p-3">

      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="app-page-heading">Dashboard</h2>
        <p className="app-page-sub">Overview of your healthcare journey</p>
      </div>

      {/* ── STATS GRID ── */}
      <div className="dashboard-stats-grid mb-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="dashboard-stat-card">
            <div
              className="stat-icon-circle"
              style={{ background: `${stat.color}15`, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div>
              <div className="stat-title">{stat.label}</div>
              <div className="stat-number">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN ROW ── */}
      <CRow>
        {/* Recent Bookings */}
        <CCol md={8} className="mb-4">
          <div className="app-card" style={{ height: '100%' }}>
            <div className="app-card-header">
              <div className="app-card-header-left">
                <div className="app-icon-box app-icon-navy">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="app-card-title">Recent Bookings</p>
                  <p className="app-card-sub">{bookings.length} total appointments</p>
                </div>
              </div>
              <button className="app-link-btn" onClick={() => navigate('/bookings')}>
                View All <ArrowRight size={15} />
              </button>
            </div>

            <div className="app-card-body">
              {bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.slice(0, 3).map((booking, idx) => {
                    const { month, day } = parseServiceDate(booking.serviceDate);
                    const statusStyle = getStatusStyle(booking.status);
                    return (
                      <div
                        key={idx}
                        className="app-booking-item"
                        onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                            <div className="app-date-badge">
                              <span className="app-date-month">{month}</span>
                              <span className="app-date-day">{day}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.doctorName}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <MapPin size={11} color="var(--c-text-3)" style={{ flexShrink: 0 }} />
                                {booking.branchName}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={17} color="var(--c-text-3)" />


                        </div>

                        {/* Bottom row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-text-3)' }}>
                            <Clock size={13} />
                            <span>{booking.servicetime}</span>
                          </div>
                          <span
                            className="app-booking-chip"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {booking.status}
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="app-empty">
                  <Calendar size={48} />
                  <p style={{ margin: 0, fontSize: 14 }}>No recent bookings found</p>
                </div>
              )}
            </div>
          </div>
        </CCol>

        {/* Health Score */}
        <CCol md={4} className="mb-4">
          <div className="app-health-card">
            <div className="app-health-card-body">
              <div className="app-health-icon-wrap">
                <TrendingUp size={28} color="#fff" />
              </div>
              <h3 className="app-health-title">Your Health Score</h3>
              <p className="app-health-desc">
                You've completed <strong style={{ color: '#fdba74' }}>85%</strong> of your recommended sessions this week. Keep it up!
              </p>
              <button className="app-health-cta">
                View Recommendations <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </CCol>
      </CRow>
    </div>
  );
};

export default Dashboard;