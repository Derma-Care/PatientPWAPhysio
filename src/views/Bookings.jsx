import React, { useEffect, useState } from 'react';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CSpinner,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronRight,
  Stethoscope,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing'); // ongoing or completed

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.branchname.toLowerCase().includes(searchTerm.toLowerCase());

    const isCompleted = booking.status?.toLowerCase() === 'completed';
    const matchesTab = activeTab === 'completed' ? isCompleted : !isCompleted;

    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in-progress': return { bg: '#dcfce7', text: '#16a34a' };
      case 'confirmed': return { bg: '#dbeafe', text: '#2563eb' };
      case 'completed': return { bg: '#f3e8ff', text: '#7c3aed' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-dark m-0">My Bookings</h2>
            <p className="text-secondary m-0">Track your appointments and treatment history</p>
          </div>
          <div className="d-flex gap-2 w-100 w-md-auto">
            <CInputGroup className="shadow-sm rounded-4 overflow-hidden w-100" style={{ maxWidth: '400px' }}>
              <CInputGroupText className="bg-white border-end-0 pe-0">
                <Search size={18} className="text-secondary" />
              </CInputGroupText>
              <CFormInput
                placeholder="Search bookings..."
                className="border-start-0 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CInputGroup>
          </div>
        </div>

        <CNav variant="pills" className="premium-nav rounded-4 p-1 bg-white shadow-sm d-inline-flex w-100 w-sm-auto mb-2">
          <CNavItem className="flex-grow-1 flex-sm-grow-0 text-center">
            <CNavLink
              active={activeTab === 'ongoing'}
              className={`rounded-3 px-4 py-2 fw-bold cursor-pointer w-100 ${activeTab === 'ongoing'
                ? 'text-white'
                : 'text-secondary'
                }`}
              onClick={() => setActiveTab('ongoing')}
              style={
                activeTab === 'ongoing'
                  ? {
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                  }
                  : {}
              }
            >
              Ongoing
            </CNavLink>
          </CNavItem>

          <CNavItem className="flex-grow-1 flex-sm-grow-0 text-center">
            <CNavLink
              active={activeTab === 'completed'}
              className={`rounded-3 px-4 py-2 fw-bold cursor-pointer w-100 ${activeTab === 'completed'
                ? 'text-white'
                : 'text-secondary'
              }`}
              onClick={() => setActiveTab('completed')}
              style={
                activeTab === 'completed'
                  ? {
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                  }
                  : {}
              }
            >
              Completed
            </CNavLink>
          </CNavItem>
        </CNav>
      </div>

      <CRow>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, idx) => {
            const statusStyle = getStatusColor(booking.status);
            return (
              <CCol lg={6} key={idx} className="mb-4">
                <CCard
                  className="premium-card border-0 cursor-pointer h-100 bookings-list-card"
                  onClick={() => navigate(`/bookings/${booking.bookingId}`)}
                >
                  <CCardBody className="p-4 d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                        <div className="bg-primary bg-opacity-10 p-3 rounded-4 d-none d-sm-flex align-items-center justify-content-center" style={{ flexShrink: 0, width: '56px', height: '56px' }}>
                          <Stethoscope size={24} className="text-white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold fs-5 text-dark text-truncate">{booking.doctorName}</div>
                          <div className="small text-secondary fw-semibold text-truncate">ID: {booking.bookingId}</div>
                        </div>
                      </div>
                      <span 
                        className="booking-status-chip shadow-sm"
                        style={{ background: statusStyle.bg, color: statusStyle.text, flexShrink: 0 }}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="bg-light p-3 rounded-4 mb-3 flex-grow-1">
                      <CRow className="g-3">
                        <CCol xs={12} sm={6} className="bookings-list-border-right">
                          <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                            <Calendar size={14} style={{ flexShrink: 0 }} /> Date & Time
                          </div>
                          <div className="fw-bold text-dark small">
                            {booking.serviceDate} • {booking.servicetime}
                          </div>
                        </CCol>
                        <CCol xs={12} sm={6} className="bookings-list-ps-left">
                          <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                            <MapPin size={14} style={{ flexShrink: 0 }} /> Branch
                          </div>
                          <div className="fw-bold text-dark small text-truncate">
                            {booking.branchname}
                          </div>
                        </CCol>
                      </CRow>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar-group d-flex">
                          <div className="bg-secondary bg-opacity-10 rounded-circle small d-flex align-items-center justify-content-center fw-bold text-secondary" style={{ width: '32px', height: '32px' }}>
                            {booking.visitCount || '1'}
                          </div>
                        </div>
                        <span className="small text-secondary">Total Visits</span>
                      </div>
                      <div className="text-primary fw-bold d-flex align-items-center gap-1 small">
                        View Details <ChevronRight size={16} />
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            );
          })
        ) : (
          <CCol className="text-center py-5">
            <div className="text-secondary opacity-50 mb-3">
              <Filter size={64} />
            </div>
            <h4>No bookings found</h4>
            <p>Try searching for a different doctor or booking ID</p>
          </CCol>
        )}
      </CRow>
    </div>
  );
};

export default Bookings;
