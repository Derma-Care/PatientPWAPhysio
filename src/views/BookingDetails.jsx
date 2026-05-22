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
  Download,
  Home
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
  const [visitDoctorId, setVisitDoctorId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (user?.customerId && id) {
          const bookingRes = await customerService.getBookingById(id);
          const currentBooking = bookingRes.data || bookingRes;

          if (currentBooking) {
            setBooking(currentBooking);

            // Fetch Doctor Info
            if (currentBooking.doctorId) {
              const doctorRes = await clinicService.getDoctor(currentBooking.doctorId);
              setDoctor(doctorRes.data);
            }

            // Fetch Visit History
            const historyRes = await physiotherapyService.getVisitHistory({
              doctorId: currentBooking.doctorId || '',
              patientId: currentBooking.patientId,
              bookingId: currentBooking.bookingId,
              clinicId: currentBooking.clinicId || '',
              branchId: currentBooking.branchId || ''
            });
            const resData = historyRes.data;
            const historyArray = resData ? (Array.isArray(resData) ? resData : [resData]) : [];
            setVisitHistory(historyArray);
            // Extract doctorId from visit history response (not available on booking object)
            const extractedDoctorId = historyArray[0]?.physiotherapyDoctorData?.treatmentPlan?.doctorId || '';
            setVisitDoctorId(extractedDoctorId);
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
        <img src="/favicon.png" className="logo-spinner-grow mb-3" alt="Loading..." />
        <h5 className="text-secondary opacity-75 fw-semibold">Fetching details...</h5>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <p className="text-secondary opacity-75 mb-2 small" style={{ marginBottom: '0.75rem' }}>Booking not found</p>
        <CButton
          color="primary"
          size="sm"
          className="rounded-pill px-3 py-1 fw-bold text-white shadow-sm"
          style={{ backgroundColor: 'var(--primary-color)', border: 'none' }}
          onClick={() => navigate('/bookings')}
        >
          Back to Bookings
        </CButton>

      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <CButton color="link" className="p-0 text-decoration-none text-secondary mb-3 d-flex align-items-center gap-2" onClick={() => navigate('/bookings')}>
          <ArrowLeft size={18} /> Back to Bookings
        </CButton>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2  ">
          <h2 className="fw-bold text-dark m-0">Booking Details</h2>
          <CBadge
            style={{
              backgroundColor: 'var(--primary-color)',
              fontSize: window.innerWidth < 768 ? '11px' : '16px',
              padding: window.innerWidth < 768 ? '4px 10px' : '8px 16px',
            }}
            shape="pill"
            className="text-capitalize text-white shadow-sm"
          >
            {booking.status}
          </CBadge>
        </div>
      </div>

      {/* Doctor Info Card - Show on top in mobile */}
      {doctor && (
        <div className="d-block d-lg-none mb-4">
          <CCard className="premium-card doctor-mobile-card border-0">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <CAvatar
                  src={doctor.doctorPicture || "https://ui-avatars.com/api/?name=" + doctor.doctorName}
                  className="shadow-sm border border-3 border-white"
                  style={{ width: '64px', height: '64px', borderRadius: '16px' }}
                />
                <div style={{ minWidth: 0 }}>
                  <h6 className="fw-bold text-dark mb-0 text-truncate">{doctor.doctorName}</h6>
                  <div className="text-primary small fw-bold">{doctor.specialization}</div>
                  <div className="small text-secondary mt-1">Exp: {doctor.experience} Yrs</div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2 mb-3">
                <div className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                  <Stethoscope size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                  <div className="small"><span className="text-secondary">Licence: </span><span className=" text-dark">{doctor.doctorLicence}</span></div>
                </div>
                <div className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                  <MapPin size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                  <div className="small text-truncate"><span className="text-secondary">Available: </span><p className=" text-dark">{doctor.availableDays} • {doctor.availableTimes}</p></div>
                </div>
              </div>

              <a
                href={`tel:${doctor.doctorMobileNumber}`}
                className="btn btn-premium w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 text-decoration-none"
              >
                <Phone size={18} /> Call Doctor
              </a>
            </CCardBody>
          </CCard>
        </div>
      )}

      <CRow>
        <CCol lg={8}>
          {/* Booking Info Card */}
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-4 booking-section-icon">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="m-0 fw-bold">Case Information</h5>
                  <p className="small text-secondary m-0">Reference ID: {booking.bookingId}</p>
                </div>
              </div>

              {/* Mobile-optimized info layout */}
              <div className="booking-detail-grid">
                <div className="booking-detail-section">
                  <div className="booking-detail-row">
                    <Calendar size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Date</div>
                      <div className="fw-bold text-dark">{booking.serviceDate}</div>
                    </div>
                  </div>
                  <div className="booking-detail-row">
                    <Clock size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Time Slot</div>
                      <div className="fw-bold text-dark">{booking.servicetime}</div>
                    </div>
                  </div>
                  <div className="booking-detail-row">
                    <Activity size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Problem</div>
                      <div className="fw-bold text-dark text-truncate">{booking.problem || 'Not specified'}</div>
                    </div>
                  </div>
                </div>

                <div className="booking-detail-section">
                  <div className="booking-detail-row">
                    <MapPin size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Clinic Branch</div>
                      <div className="fw-bold text-dark">{booking.branchname}</div>
                    </div>
                  </div>
                  <div className="booking-detail-row">
                    <User size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Patient Details</div>
                      <div className="fw-bold text-dark">{booking.name}</div>
                      <div className="small text-secondary">{booking.age} Yrs • {booking.gender}</div>
                    </div>
                  </div>
                  <div className="booking-detail-row">
                    <Phone size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="small text-secondary">Contact</div>
                      <div className="fw-bold text-dark">{booking.patientMobileNumber}</div>
                    </div>
                  </div>
                </div>

                <div className="booking-detail-section booking-payment-section">
                  <h6 className="fw-bold small text-secondary mb-2">Payment Summary</h6>
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
                </div>
              </div>
            </CCardBody>
          </CCard>

          {/* Reports & Prescriptions Card */}
          <CCard className="premium-card border-0 mb-4">
            <CCardBody className="p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-warning bg-opacity-10 p-3 rounded-4 booking-section-icon">
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
                    <CCol sm={6} key={rIdx} className="report-col">
                      <div
                        className="p-3 border rounded-4 d-flex justify-content-between align-items-center cursor-pointer hover-bg-light h-100 transition-all shadow-sm-hover"
                        onClick={async () => {
                          const fileData = report.reportFile?.[0];
                          if (fileData) {
                            try {
                              let url;
                              let isBlobUrl = false;
                              if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
                                url = fileData;
                              } else {
                                const base64String = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
                                const cleanBase64 = base64String.replace(/\s/g, '');
                                const res = await fetch(`data:application/pdf;base64,${cleanBase64}`);
                                const blob = await res.blob();
                                url = URL.createObjectURL(blob);
                                isBlobUrl = true;
                              }

                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${report.reportName || 'Report'}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              if (isBlobUrl) {
                                URL.revokeObjectURL(url);
                              }
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
                        <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                          <div className={`bg-${report.reportStatus === 'Normal' ? 'info' : 'danger'} bg-opacity-10 p-2 rounded-3 text-${report.reportStatus === 'Normal' ? 'info' : 'danger'}`} style={{ flexShrink: 0 }}>
                            <FileSearch size={22} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark small text-truncate">{report.reportName}</div>
                            <div className="small text-secondary text-truncate">{report.reportType} • {report.reportDate}</div>
                          </div>
                        </div>
                        <CButton color="link" className="p-0 text-primary hover-scale" style={{ flexShrink: 0 }}>
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
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 visit-history-header">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded-4 booking-section-icon">
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
                    size="sm"
                    onClick={() => navigate(`/bookings/${booking.bookingId}/history?patientId=${booking.patientId}&doctorId=${visitDoctorId}&clinicId=${booking.clinicId || ''}&branchId=${booking.branchId || ''}`)}
                  >
                    View Full History <ChevronRight size={16} />
                  </CButton>
                )}
              </div>

              {visitHistory.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="d-none d-md-block table-responsive">
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
                          <CTableRow key={idx}>
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
                              <div className="d-flex gap-2 justify-content-end align-items-center">
                                {visit.visitNumber?.toLowerCase() === 'visit 1' && (
                                  <>
                                    <CButton
                                      size="sm"
                                      className="btn-premium py-1 px-2 d-flex align-items-center gap-1"
                                      style={{ fontSize: '0.75rem', background: '#0ea5e9', border: 'none' }}
                                      onClick={() => navigate(`/bookings/${booking.bookingId}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&therapistId=${visit.physiotherapyDoctorData?.treatmentPlan?.therapistId || ''}`)}
                                    >
                                      <Activity size={12} /> Sessions
                                    </CButton>
                                    <CButton
                                      size="sm"
                                      className="btn-premium py-1 px-2 d-flex align-items-center gap-1"
                                      style={{ fontSize: '0.75rem', background: 'var(--primary-gradient)', border: 'none' }}
                                      onClick={() => navigate(`/bookings/${booking.bookingId}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&doctorId=${visitDoctorId}`, { state: { visit } })}
                                    >
                                      <Home size={12} /> Exercises
                                    </CButton>
                                  </>
                                )}
                                <CButton color="link" className="p-0 text-primary" onClick={() => navigate(`/bookings/${booking.bookingId}/history?patientId=${booking.patientId}&doctorId=${visitDoctorId}&clinicId=${booking.clinicId || ''}&branchId=${booking.branchId || ''}`, { state: { singleVisit: true, visit } })}>
                                  <ChevronRight size={18} />
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>

                  <div className="d-flex d-md-none flex-column gap-2">
                    {visitHistory.slice(0, 3).map((visit, idx) => (
                      <div key={idx} className="visit-mobile-card">
                        <div className="d-flex justify-content-between align-items-start" onClick={() => navigate(`/bookings/${booking.bookingId}/history?patientId=${booking.patientId}&doctorId=${visitDoctorId}&clinicId=${booking.clinicId || ''}&branchId=${booking.branchId || ''}`, { state: { singleVisit: true, visit } })}>
                          <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                            <div className="visit-mobile-number">{idx + 1}</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="fw-bold text-dark small">{visit.visitNumber}</div>
                              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{visit.visitDate} • {visit.visitTime}</div>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                        </div>
                        {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis && (
                          <div className="mt-2 pt-2 border-top">
                            <div className="small text-secondary">Diagnosis</div>
                            <div className="small fw-semibold text-dark text-truncate">
                              {visit.physiotherapyDoctorData.diagnosis.physioDiagnosis}
                            </div>
                          </div>
                        )}
                        {visit.visitNumber?.toLowerCase() === 'visit 1' && (
                          <div className="d-flex gap-2 mt-2 pt-2 border-top">
                            <CButton
                              size="sm"
                              className="btn-premium flex-grow-1 py-1 d-flex align-items-center justify-content-center gap-1"
                              style={{ fontSize: '0.75rem', background: '#0ea5e9', border: 'none' }}
                              onClick={() => navigate(`/bookings/${booking.bookingId}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&therapistId=${visit.physiotherapyDoctorData?.treatmentPlan?.therapistId || ''}`)}
                            >
                              <Activity size={12} /> Sessions
                            </CButton>
                            <CButton
                              size="sm"
                              className="btn-premium flex-grow-1 py-1 d-flex align-items-center justify-content-center gap-1"
                              style={{ fontSize: '0.75rem', background: 'var(--primary-gradient)', border: 'none' }}
                              onClick={() => navigate(`/bookings/${booking.bookingId}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&doctorId=${visitDoctorId}`, { state: { visit } })}
                            >
                              <Home size={12} /> Exercises
                            </CButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-secondary opacity-50">
                  <p>No visit history available for this booking.</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Doctor Info - Desktop Sidebar */}
        <CCol lg={4} className="d-none d-lg-block">
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

                <a
                  href={`tel:${doctor.doctorMobileNumber}`}
                  className="btn btn-premium w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 text-decoration-none"
                >
                  <Phone size={18} /> Contact Doctor
                </a>
              </CCardBody>
            </CCard>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default BookingDetails;
