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
  Stethoscope
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

  return (
    <div className="fade-in">
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-dark m-0">My Bookings</h2>
            <p className="text-secondary m-0">Track your appointments and treatment history</p>
          </div>
          <div className="d-flex gap-2">
            <CInputGroup className="shadow-sm rounded-4 overflow-hidden" style={{ width: '300px' }}>
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

        <CNav variant="pills" className="premium-nav rounded-4 p-1 bg-white shadow-sm d-inline-flex">
          <CNavItem>
            <CNavLink
              active={activeTab === 'ongoing'}
              className={`rounded-3 px-4 py-2 fw-bold cursor-pointer ${activeTab === 'ongoing'
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

          <CNavLink
            active={activeTab === 'completed'}
            className={`rounded-3 px-4 py-2 fw-bold cursor-pointer ${activeTab === 'completed'
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
        </CNav>
      </div>

      <CRow>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, idx) => (
            <CCol lg={6} key={idx} className="mb-4">
              <CCard
                className="premium-card border-0 cursor-pointer"
                onClick={() => navigate(`/bookings/${booking.bookingId}`)}
              >
                <CCardBody className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                        <Stethoscope size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="fw-bold fs-5 text-dark">{booking.doctorName}</div>
                        <div className="small text-secondary fw-semibold">ID: {booking.bookingId}</div>
                      </div>
                    </div>
                    <CBadge color={booking.status === 'in-progress' ? 'success' : 'info'} shape="pill" className="px-3 py-2 text-capitalize">
                      {booking.status}
                    </CBadge>
                  </div>

                  <div className="bg-light p-3 rounded-4 mb-3">
                    <CRow>
                      <CCol xs={6} className="border-end">
                        <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                          <Calendar size={14} /> Date & Time
                        </div>
                        <div className="fw-bold text-dark small">
                          {booking.serviceDate} • {booking.servicetime}
                        </div>
                      </CCol>
                      <CCol xs={6} className="ps-4">
                        <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                          <MapPin size={14} /> Branch
                        </div>
                        <div className="fw-bold text-dark small">
                          {booking.branchname}
                        </div>
                      </CCol>
                    </CRow>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-group d-flex">
                        <div className="bg-secondary bg-opacity-10 rounded-circle small d-flex align-items-center justify-content-center fw-bold text-secondary" style={{ width: '32px', height: '32px' }}>
                          {booking.visitCount || '1'}
                        </div>
                      </div>
                      <span className="small text-secondary">Total Visits</span>
                    </div>
                    <div className="text-primary fw-bold d-flex align-items-center gap-1">
                      View Details <ChevronRight size={16} />
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))
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
