import React, { useEffect, useState } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CBadge,
} from '@coreui/react';
import { 
  Calendar, 
  Clock, 
  Activity, 
  User as UserIcon, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  const stats = [
    { title: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'var(--accent-orange)' },
    { title: 'Ongoing Sessions', value: bookings.filter(b => b.status === 'in-progress').length, icon: Activity, color: '#2dd4bf' },
    { title: 'Upcoming Visits', value: bookings.filter(b => b.status === 'confirmed').length, icon: Clock, color: '#3b82f6' },
    { title: 'Total Reports', value: 0, icon: FileText, color: '#f43f5e' },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h2 className="fw-bold text-dark">Dashboard</h2>
        <p className="text-secondary">Overview of your healthcare journey</p>
      </div>

      <CRow className="mb-4">
        {stats.map((stat, idx) => (
          <CCol sm={6} lg={3} key={idx} className="mb-4">
            <CCard className="premium-card h-100 border-0">
              <CCardBody className="d-flex align-items-center p-4">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: '56px', height: '56px', background: `${stat.color}15`, color: stat.color }}
                >
                  <stat.icon size={28} />
                </div>
                <div>
                  <div className="text-secondary small fw-bold text-uppercase tracking-wider">{stat.title}</div>
                  <div className="fs-3 fw-bold text-dark">{stat.value}</div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <CRow>
        <CCol md={8} className="mb-4">
          <CCard className="premium-card h-100 border-0">
            <CCardHeader className="bg-transparent border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold">Recent Bookings</h5>
              <CButton color="link" className="text-decoration-none p-0 text-primary fw-600" onClick={() => navigate('/bookings')}>
                View All <ArrowRight size={16} />
              </CButton>
            </CCardHeader>
            <CCardBody className="px-4 pb-4">
              {bookings.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {bookings.slice(0, 3).map((booking, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 border rounded-4 d-flex align-items-center justify-content-between hover-bg-light cursor-pointer transition-all"
                      onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                      style={{ background: 'var(--light-blue)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-white p-2 rounded-3 shadow-sm text-center" style={{ minWidth: '60px' }}>
                          <div className="small text-secondary fw-bold">{new Date(booking.serviceDate).toLocaleString('en-US', { month: 'short' })}</div>
                          <div className="fs-5 fw-bold text-dark">{new Date(booking.serviceDate).getDate()}</div>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{booking.doctorName}</div>
                          <div className="small text-secondary">{booking.branchname} • {booking.servicetime}</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <CBadge color={booking.status === 'in-progress' ? 'success' : 'info'} shape="pill" className="px-3 py-2">
                          {booking.status}
                        </CBadge>
                        <ChevronRight size={20} className="text-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-secondary">
                  <Calendar size={48} className="mb-3 opacity-25" />
                  <p>No recent bookings found.</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4} className="mb-4">
          <CCard className="premium-card h-100 border-0 text-white" style={{ background: 'var(--orange-gradient)' }}>
            <CCardBody className="p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="bg-white bg-opacity-25 rounded-circle d-inline-flex p-3 mb-4">
                  <TrendingUp size={32} />
                </div>
                <h3 className="fw-bold mb-3">Your Health Score</h3>
                <p className="opacity-90 mb-4">You've completed 85% of your recommended sessions this week. Keep it up!</p>
              </div>
              <CButton color="light" className="fw-bold border-0 py-3 rounded-4 w-100 text-dark">
                View Recommendations
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default Dashboard;
