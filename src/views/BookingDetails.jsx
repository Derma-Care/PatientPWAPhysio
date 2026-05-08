import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CSpinner,
  CButton,
  CAvatar,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  FileText,
  Activity,
  ChevronRight,
  Stethoscope,
  Info,
  CreditCard,
  Clipboard,
  FileSearch,
  Download
} from 'lucide-react';
import { customerService, clinicService, physiotherapyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (user?.customerId && id) {
          const bookingsRes = await customerService.getBookings(user.customerId);
          const currentBooking = bookingsRes.data.find(b => b.bookingId === id);

          if (currentBooking) {
            setBooking(currentBooking);

            // Fetch Doctor Info
            if (currentBooking.doctorId) {
              const doctorRes = await clinicService.getDoctor(currentBooking.doctorId);
              setDoctor(doctorRes.data);
            }

            // Fetch Visit History
            const historyRes = await physiotherapyService.getVisitHistory(currentBooking.patientId, currentBooking.bookingId);
            setVisitHistory(historyRes.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, user]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <CSpinner color="primary" variant="grow" className="mb-3" />
        <h5 className="text-secondary opacity-75 fw-semibold">Fetching details...</h5>
      </div>
    );
  }

  if (!booking) {
    return <div>Booking not found.</div>;
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <CButton color="link" className="p-0 text-decoration-none text-secondary mb-3 d-flex align-items-center gap-2" onClick={() => navigate('/bookings')}>
          <ArrowLeft size={18} /> Back to Bookings
        </CButton>
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="fw-bold text-dark m-0">Booking Details</h2>
          <CBadge style={{ backgroundColor: 'var(--primary-color)' }} shape="pill" className="px-4 py-2 fs-6 text-capitalize text-white shadow-sm">
            {booking.status}
          </CBadge>
        </div>
      </div>

      <CRow>
        <CCol lg={8}>
          {/* Booking Info Card */}
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="m-0 fw-bold">Case Information</h5>
                  <p className="small text-secondary m-0">Reference ID: {booking.bookingId}</p>
                </div>
              </div>

              <CRow className="g-4">
                <CCol md={4}>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <Calendar size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Date</div>
                        <div className="fw-bold text-dark">{booking.serviceDate}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Clock size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Time Slot</div>
                        <div className="fw-bold text-dark">{booking.servicetime}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Activity size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Problem</div>
                        <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '150px' }}>{booking.problem || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <MapPin size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Clinic Branch</div>
                        <div className="fw-bold text-dark">{booking.branchname}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <User size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Patient Details</div>
                        <div className="fw-bold text-dark">{booking.name}</div>
                        <div className="small text-secondary">{booking.age} Yrs • {booking.gender}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Phone size={18} className="text-secondary" />
                      <div>
                        <div className="small text-secondary">Contact</div>
                        <div className="fw-bold text-dark">{booking.patientMobileNumber}</div>
                      </div>
                    </div>
                  </div>
                </CCol>
                <CCol md={4}>
                  <div className="d-flex flex-column gap-3 border-start ps-md-4">
                    <h6 className="fw-bold small text-secondary mb-1">Payment Summary</h6>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Consultation Fee:</span>
                      <span className="fw-bold">₹{booking.consultationFee || '0'}</span>
                    </div>
                    {booking.totalBill && (
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Total Bill:</span>
                        <span className="fw-bold">₹{booking.totalBill}</span>
                      </div>
                    )}
                    {booking.paidAmount && (
                      <div className="d-flex justify-content-between small mb-1 text-success">
                        <span>Paid:</span>
                        <span className="fw-bold">₹{booking.paidAmount}</span>
                      </div>
                    )}
                    {booking.balance && (
                      <div className="d-flex justify-content-between small mb-1 text-danger">
                        <span>Balance:</span>
                        <span className="fw-bold">₹{booking.balance}</span>
                      </div>
                    )}
                    {/* <CBadge color={booking.paymentStatus === 'Paid' ? 'success' : 'warning'} className="mt-2 py-2">
                      {booking.paymentStatus || 'Pending'}
                    </CBadge> */}
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Reports & Prescriptions Card */}
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-warning bg-opacity-10 p-3 rounded-4">
                  <Clipboard size={24} className="text-warning" />
                </div>
                <div>
                  <h5 className="m-0 fw-bold">Reports & Prescriptions</h5>
                  <p className="small text-secondary m-0">Medical documents and clinical records</p>
                </div>
              </div>

              <CRow className="g-3">
                {(() => {
                  const reportsArray = Array.isArray(booking?.reports) ? booking.reports : [];
                  const allReports = reportsArray.flatMap(r => Array.isArray(r?.reportsList) ? r.reportsList : []);

                  if (allReports.length === 0) {
                    return (
                      <CCol xs={12}>
                        <div className="text-center py-4 text-secondary opacity-50 bg-light rounded-4 border-dashed border">
                          <p className="m-0">No medical reports available yet.</p>
                        </div>
                      </CCol>
                    );
                  }

                  return allReports.map((report, rIdx) => (
                    <CCol md={6} key={rIdx}>
                      <div
                        className="p-3 border rounded-4 d-flex justify-content-between align-items-center cursor-pointer hover-bg-light h-100 transition-all shadow-sm-hover"
                        onClick={() => {
                          const fileData = report.reportFile?.[0];
                          if (fileData) {
                            try {
                              const byteCharacters = atob(fileData);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: 'application/pdf' });
                              const url = URL.createObjectURL(blob);

                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${report.reportName || 'Report'}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error('Error downloading report:', e);
                              Swal.fire({
                                icon: 'error',
                                title: 'Download Failed',
                                text: 'There was an error processing the report file.',
                              });
                            }
                          } else if (report.reportUrl) {
                            window.open(report.reportUrl, '_blank');
                          } else {
                            Swal.fire({
                              icon: 'info',
                              title: 'Report Unavailable',
                              text: 'This medical report is currently being processed or is not available for download.',
                              timer: 3000
                            });
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className={`bg-${report.reportStatus === 'Normal' ? 'info' : 'danger'} bg-opacity-10 p-2 rounded-3 text-${report.reportStatus === 'Normal' ? 'info' : 'danger'}`}>
                            <FileSearch size={22} />
                          </div>
                          <div>
                            <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '180px' }}>{report.reportName}</div>
                            <div className="small text-secondary">{report.reportType} • {report.reportDate}</div>
                          </div>
                        </div>
                        <CButton color="link" className="p-0 text-primary hover-scale">
                          <Download size={20} />
                        </CButton>
                      </div>
                    </CCol>
                  ));
                })()}
              </CRow>
            </CCardBody>
          </CCard>

          {/* Visit History Summary */}
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded-4">
                    <Activity size={24} className="text-info" />
                  </div>
                  <div>
                    <h5 className="m-0 fw-bold">Visit History</h5>
                    <p className="small text-secondary m-0">{visitHistory.length} Recorded Visits</p>
                  </div>
                </div>
                {visitHistory.length > 0 && (
                  <CButton
                    color="primary"
                    variant="outline"
                    className="rounded-4 fw-bold"
                    onClick={() => navigate(`/bookings/${booking.bookingId}/history?patientId=${booking.patientId}`)}
                  >
                    View Full History <ChevronRight size={16} />
                  </CButton>
                )}
              </div>

              {visitHistory.length > 0 ? (
                <div className="table-responsive">
                  <CTable align="middle" hover borderless className="mb-0">
                    <CTableHead className="text-secondary small text-uppercase">
                      <CTableRow>
                        <CTableHeaderCell className="border-bottom-0 ps-0">Visit</CTableHeaderCell>
                        <CTableHeaderCell className="border-bottom-0">Date</CTableHeaderCell>
                        <CTableHeaderCell className="border-bottom-0">Diagnosis</CTableHeaderCell>
                        <CTableHeaderCell className="border-bottom-0 text-end pe-0">Action</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {visitHistory.slice(0, 3).map((visit, idx) => (
                        <CTableRow key={idx} className="cursor-pointer">
                          <CTableDataCell className="ps-0">
                            <div className="fw-bold text-dark">{visit.visitNumber}</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small text-secondary">{visit.visitDate}</div>
                            <div className="small fw-semibold">{visit.visitTime}</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small text-dark fw-semibold">
                              {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis || 'N/A'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="text-end pe-0">
                            <CButton color="link" className="p-0 text-primary" onClick={() => navigate(`/bookings/${booking.bookingId}/history?patientId=${booking.patientId}`)}>
                              <ChevronRight size={18} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              ) : (
                <div className="text-center py-4 text-secondary opacity-50">
                  <p>No visit history available for this booking.</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          {/* Doctor Info Card */}
          {doctor && (
            <CCard className="premium-card border-0 mb-4 sticky-top" style={{ top: '100px' }}>
              <CCardBody className="p-4">
                <div className="text-center mb-4">
                  <CAvatar src={doctor.doctorPicture || "https://ui-avatars.com/api/?name=" + doctor.doctorName} size="xl" className="mb-3 shadow-sm border border-4 border-white" style={{ width: '100px', height: '100px' }} />
                  <h5 className="fw-bold text-dark mb-1">{doctor.doctorName}</h5>
                  <p className="text-primary small fw-bold mb-3">{doctor.specialization}</p>
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    <CBadge color="light" className="text-dark py-2 px-3 border">
                      Exp: {doctor.experience} Yrs
                    </CBadge>
                    <CBadge color="light" className="text-dark py-2 px-3 border">
                      Rating: {doctor.doctorAverageRating || '5.0'} ⭐
                    </CBadge>
                  </div>
                </div>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-2 rounded-3">
                      <Stethoscope size={18} className="text-secondary" />
                    </div>
                    <div>
                      <div className="small text-secondary">Licence</div>
                      <div className="small fw-bold text-dark">{doctor.doctorLicence}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-2 rounded-3">
                      <Phone size={18} className="text-secondary" />
                    </div>
                    <div>
                      <div className="small text-secondary">Contact</div>
                      <div className="small fw-bold text-dark">{doctor.doctorMobileNumber}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-2 rounded-3">
                      <MapPin size={18} className="text-secondary" />
                    </div>
                    <div>
                      <div className="small text-secondary">Availability</div>
                      <div className="small fw-bold text-dark">{doctor.availableDays} • {doctor.availableTimes}</div>
                    </div>
                  </div>
                </div>

                <CButton className="btn-premium w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2">
                  <Phone size={18} /> Contact Doctor
                </CButton>
              </CCardBody>
            </CCard>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default BookingDetails;
