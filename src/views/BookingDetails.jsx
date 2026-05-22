import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, User,
  FileText, Activity, ChevronRight, Stethoscope,
  CreditCard, Clipboard, FileSearch, Download, Home,
  Star, Shield, AlertCircle, CheckCircle, TrendingUp,
  Building2,
} from 'lucide-react';
import { customerService, clinicService, physiotherapyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import '../styles/theme.css'; // ← shared theme
import { CButton, CModal, CModalBody, CModalHeader, CModalTitle } from '@coreui/react';

/* ── status helper ── */
const statusClass = (s = '') => {
  const map = { confirmed: 'confirmed', pending: 'pending', cancelled: 'cancelled', completed: 'completed', 'in-progress': 'in-progress' };
  return `app-status-${map[s.toLowerCase()] || 'default'}`;
};

/* ── InfoItem ── */
const InfoItem = ({ icon: Icon, label, value, sub, iconColor }) => (
  <div className="app-info-item">
    <div style={{ marginTop: 1, flexShrink: 0 }}>
      <Icon size={15} color={iconColor || 'var(--c-text-3)'} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p className="app-info-label">{label}</p>
      <p className="app-info-value">{value || '—'}</p>
      {sub && <p className="app-info-sub">{sub}</p>}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [visitDoctorId, setVisitDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        if (user?.customerId && id) {
          const bookingRes = await customerService.getBookingById(id);
          const cur = bookingRes.data || bookingRes;
          if (cur) {
            setBooking(cur);
            if (cur.doctorId) {
              const dr = await clinicService.getDoctor(cur.doctorId);
              setDoctor(dr.data);
            }
            const histRes = await physiotherapyService.getVisitHistory({
              doctorId: cur.doctorId || '', patientId: cur.patientId,
              bookingId: cur.bookingId, clinicId: cur.clinicId || '', branchId: cur.branchId || '',
            });
            const arr = histRes.data ? (Array.isArray(histRes.data) ? histRes.data : [histRes.data]) : [];
            setVisitHistory(arr);
            setVisitDoctorId(arr[0]?.physiotherapyDoctorData?.treatmentPlan?.doctorId || '');
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, user]);

  if (loading) return (
    <div className="app-loading">
      <div className="app-loading-ring" />
      <p className="app-loading-text">Fetching details…</p>
    </div>
  );

  if (!booking) return (
    <div className="app-loading">
      <AlertCircle size={40} color="var(--c-text-3)" style={{ marginBottom: 8 }} />
      <p style={{ color: 'var(--c-text-3)', margin: '0 0 16px', fontSize: 14 }}>Booking not found</p>
      <button className="app-btn-outline-navy" onClick={() => navigate('/bookings')}>
        <ArrowLeft size={14} /> Back to Bookings
      </button>
    </div>
  );

  const allReports = (booking?.reports || []).flatMap(r => Array.isArray(r?.reportsList) ? r.reportsList : []);

  const handleDownload = async (report) => {
    const fileData = report.reportFile?.[0];
    if (fileData) {
      try {
        let url, isBlobUrl = false;
        if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
          url = fileData;
        } else {
          const b64 = (fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData).replace(/\s/g, '');
          const blob = await (await fetch(`data:application/pdf;base64,${b64}`)).blob();
          url = URL.createObjectURL(blob); isBlobUrl = true;
        }
        const a = document.createElement('a');
        a.href = url; a.download = `${report.reportName || 'Report'}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        if (isBlobUrl) URL.revokeObjectURL(url);
      } catch {
        Swal.fire({ icon: 'error', title: 'Download Failed', text: 'Error processing file.' });
      }
    } else if (report.reportUrl) {
      window.open(report.reportUrl, '_blank');
    } else {
      Swal.fire({ icon: 'info', title: 'Report Unavailable', text: 'This report is being processed.', timer: 3000 });
    }
  };

  const navHistory = (extra = {}) => navigate(
    `/bookings/${booking.bookingId}/history?patientId=${booking.patientId}&doctorId=${visitDoctorId}&clinicId=${booking.clinicId || ''}&branchId=${booking.branchId || ''}`,
    extra,
  );

  const doctorAvatar = doctor
    ? (doctor.doctorPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.doctorName)}&background=1B4F8A&color=fff&bold=true&size=200`)
    : '';

  return (
    <div className="app-page">

      {/* HERO */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => navigate('/bookings')}>
            <ArrowLeft size={14} /> Back to Bookings
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="app-hero-title">Booking Details</h1>
              <p className="app-hero-sub">Ref ID: {booking.bookingId}</p>
            </div>
            <div className={`app-status-pill ${statusClass(booking.status)}`}>
              <span className="app-status-dot" />
              {booking.status}
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="app-body" style={{ marginTop: 0 }}>

        {/* Mobile doctor card */}
        {doctor && (
          <div className="app-doc-float app-mobile-only">
            <img
              src={doctorAvatar}
              alt={doctor.doctorName}
              className="app-doc-float-avatar"
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="app-doc-float-name">
                {doctor.doctorName}
              </p>

              <p className="app-doc-float-spec">
                {doctor.specialization}
              </p>

              {/* Branch */}
              <p className="app-doc-float-meta">
                <Building2
                  size={10}
                  style={{ marginRight: 3, verticalAlign: 'middle' }}
                />
                {doctor.branchName || doctor.hospitalName}
              </p>

              <p className="app-doc-float-meta">
                <Shield
                  size={10}
                  style={{ marginRight: 3, verticalAlign: 'middle' }}
                />
                {doctor.doctorLicence} · {doctor.experience} Yrs Exp
              </p>

              <p className="app-doc-float-meta">
                <Calendar
                  size={10}
                  style={{ marginRight: 3, verticalAlign: 'middle' }}
                />
                {doctor.availableDays} · {doctor.availableTimes}
              </p>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 align-items-end align-content-end mt-3 w-100">
              <div>
                <a
                  href={`tel:${doctor.doctorMobileNumber}`}
                  className="app-doc-float-call"
                >
                  <Phone size={14} /> Call
                </a>
              </div>
              <div>
                <CButton
                  className="app-doc-float-call"
                  // style={{ backgroundColor: "var(--c-orange)", fontSize: "14px", fontWeight: "700", color: "#fff" }}
                  onClick={() => setShowDoctorModal(true)}
                >
                  View
                </CButton>
              </div>
            </div>
          </div>
        )}

        <div className="app-two-col">

          {/* LEFT */}
          <div>

            {/* Case Information */}
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-navy"><FileText size={20} /></div>
                  <div>
                    <p className="app-card-title">Case Information</p>
                    <p className="app-card-sub">Appointment & patient details</p>
                  </div>
                </div>
              </div>
              <div className="app-card-body">
                <div className="app-info-grid">
                  <InfoItem icon={Calendar} label="Service Date" value={booking.serviceDate} iconColor="var(--c-navy)" />
                  <InfoItem icon={Clock} label="Time Slot" value={booking.servicetime} iconColor="var(--c-info)" />
                  <InfoItem icon={MapPin} label="Clinic Branch" value={booking.branchname} iconColor="var(--c-warning)" />
                  <InfoItem icon={Activity} label="Chief Complaint" value={booking.problem || 'Not specified'} iconColor="var(--c-danger)" />
                  <InfoItem icon={User} label="Patient" value={booking.name}
                    sub={`${booking.age} Yrs · ${booking.gender}`} iconColor="var(--c-success)" />
                  <InfoItem icon={Phone} label="Contact" value={booking.patientMobileNumber} iconColor="var(--c-purple)" />
                </div>

                <div className="app-payment-box">
                  <p className="app-payment-title"><CreditCard size={13} /> Payment Summary</p>
                  {booking.consultationFee && (
                    <div className="app-payment-row">
                      <span>Consultation Fee</span>
                      <span style={{ fontWeight: 600 }}>₹{booking.consultationFee}</span>
                    </div>
                  )}
                  {booking.totalBill && (
                    <div className="app-payment-row total">
                      <span>Total Bill</span><span>₹{booking.totalBill}</span>
                    </div>
                  )}
                  {booking.paidAmount && (
                    <div className="app-payment-row success">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={12} /> Paid</span>
                      <span>₹{booking.paidAmount}</span>
                    </div>
                  )}
                  {booking.balance && (
                    <div className="app-payment-row danger">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} /> Balance Due</span>
                      <span>₹{booking.balance}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reports */}
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-amber"><Clipboard size={20} /></div>
                  <div>
                    <p className="app-card-title">Reports & Prescriptions</p>
                    <p className="app-card-sub">Medical documents & clinical records</p>
                  </div>
                </div>
              </div>
              <div className="app-card-body">
                {allReports.length === 0 ? (
                  <div className="app-report-empty">
                    <FileSearch size={36} style={{ opacity: .28, display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: 13 }}>No medical reports available yet</p>
                  </div>
                ) : (
                  <div className="app-report-grid">
                    {allReports.map((report, i) => {
                      const isNormal = report.reportStatus === 'Normal';
                      return (
                        <div key={i} className={`app-report-card ${isNormal ? 'normal' : 'abnormal'}`} onClick={() => handleDownload(report)}>
                          <div className="app-report-icon" style={{
                            background: isNormal ? 'var(--c-navy-xlight)' : 'var(--c-danger-light)',
                            color: isNormal ? 'var(--c-navy)' : 'var(--c-danger)',
                          }}>
                            <FileSearch size={18} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p className="app-report-name">{report.reportName}</p>
                            <p className="app-report-meta">{report.reportType} · {report.reportDate}</p>
                          </div>
                          <span className="app-report-dl"><Download size={16} /></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Visit History */}
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-sky"><TrendingUp size={20} /></div>
                  <div>
                    <p className="app-card-title">Visit History</p>
                    <p className="app-card-sub">{visitHistory.length} recorded visit{visitHistory.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {visitHistory.length > 0 && (
                  <button className="app-btn-outline-navy" onClick={() => navHistory()}>
                    Full History <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <div className="app-card-body">
                {visitHistory.length === 0 ? (
                  <div className="app-empty">
                    <Activity size={36} />
                    <p style={{ margin: 0, fontSize: 13 }}>No visit history available</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="d-none d-md-block" style={{ overflowX: 'auto' }}>
                      <table className="app-visit-table">
                        <thead>
                          <tr>
                            <th>#</th><th>Visit</th><th>Date & Time</th><th>Diagnosis</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitHistory.slice(0, 3).map((visit, idx) => (
                            <tr key={idx}>
                              <td><div className="app-visit-num">{idx + 1}</div></td>
                              <td style={{ fontWeight: 700 }}>{visit.visitNumber}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{visit.visitDate}</div>
                                <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{visit.visitTime}</div>
                              </td>
                              <td>
                                <span className="app-diag-badge">
                                  {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis || 'N/A'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                  {visit.visitNumber?.toLowerCase() === 'visit 1' && (
                                    <>
                                      <button className="app-btn-sessions" onClick={() => navigate(`/bookings/${booking.bookingId}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&therapistId=${visit.physiotherapyDoctorData?.treatmentPlan?.therapistId || ''}`)}>
                                        <Activity size={12} /> Sessions
                                      </button>
                                      <button className="app-btn-exercises" onClick={() => navigate(`/bookings/${booking.bookingId}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&doctorId=${visitDoctorId}`, { state: { visit } })}>
                                        <Home size={12} /> Exercises
                                      </button>
                                    </>
                                  )}
                                  <button className="app-btn-ghost" onClick={() => navHistory({ state: { singleVisit: true, visit } })}>
                                    <ChevronRight size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="d-flex d-md-none flex-column">
                      {visitHistory.slice(0, 3).map((visit, idx) => (
                        <div key={idx} className="app-visit-mobile">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navHistory({ state: { singleVisit: true, visit } })}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <div className="app-visit-num">{idx + 1}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{visit.visitNumber}</div>
                                <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{visit.visitDate} · {visit.visitTime}</div>
                              </div>
                            </div>
                            <ChevronRight size={16} color="var(--c-text-3)" style={{ flexShrink: 0 }} />
                          </div>
                          {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis && (
                            <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                              <div style={{ fontSize: 10, color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 3 }}>Diagnosis</div>
                              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {visit.physiotherapyDoctorData.diagnosis.physioDiagnosis}
                              </div>
                            </div>
                          )}
                          {visit.visitNumber?.toLowerCase() === 'visit 1' && (
                            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                              <button className="app-btn-sessions" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/bookings/${booking.bookingId}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&therapistId=${visit.physiotherapyDoctorData?.treatmentPlan?.therapistId || ''}`)}>
                                <Activity size={12} /> Sessions
                              </button>
                              <button className="app-btn-exercises" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/bookings/${booking.bookingId}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&doctorId=${visitDoctorId}`, { state: { visit } })}>
                                <Home size={12} /> Exercises
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>{/* end left */}

          {/* SIDEBAR */}
          <div className="app-sidebar-col">
            {doctor && (
              <div className="app-doc-sidebar">
                <div className="app-doc-sidebar-banner">
                  <img src={doctorAvatar} alt={doctor.doctorName} className="app-doc-sidebar-avatar" />
                  <p className="app-doc-sidebar-name">{doctor.doctorName}</p>
                  <p className="app-doc-sidebar-spec">{doctor.specialization}</p>
                  <div className="app-doc-exp-badge"><Star size={11} /> {doctor.experience} Years Experience</div>
                </div>
                <div className="app-doc-sidebar-body">
                  <div className="app-doc-detail-row">
                    <div className="app-doc-detail-icon"><Shield size={15} color="var(--c-navy)" /></div>
                    <div><p className="app-doc-detail-label">Licence</p><p className="app-doc-detail-value">{doctor.doctorLicence}</p></div>
                  </div>
                  <div className="app-doc-detail-row">
                    <div className="app-doc-detail-icon"><Phone size={15} color="var(--c-success)" /></div>
                    <div><p className="app-doc-detail-label">Contact</p><p className="app-doc-detail-value">{doctor.doctorMobileNumber}</p></div>
                  </div>
                  <div className="app-doc-detail-row">
                    <div className="app-doc-detail-icon"><Calendar size={15} color="var(--c-warning)" /></div>
                    <div><p className="app-doc-detail-label">Available Days</p><p className="app-doc-detail-value">{doctor.availableDays}</p></div>
                  </div>
                  <div className="app-doc-detail-row">
                    <div className="app-doc-detail-icon"><Clock size={15} color="var(--c-purple)" /></div>
                    <div><p className="app-doc-detail-label">Available Times</p><p className="app-doc-detail-value">{doctor.availableTimes}</p></div>
                  </div>
                </div>
                <a href={`tel:${doctor.doctorMobileNumber}`} className="app-doc-call-btn">
                  <Phone size={18} /> Contact Doctor
                </a>
              </div>
            )}
          </div>

        </div>{/* end two-col */}
      </div>



      {/* Doctor Details Modal */}
      <CModal
        visible={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>
            Doctor Full Details
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div className="text-center mb-4">
            <img
              src={doctorAvatar}
              alt={doctor.doctorName}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #eee'
              }}
            />

            <h5 className="mt-3 mb-1">
              {doctor.doctorName}
            </h5>

            <p className="text-muted mb-0">
              {doctor.specialization}
            </p>
          </div>

          <div className="row g-3">

            <div className="col-6">
              <strong>Doctor ID</strong>
              <p>{doctor.doctorId}</p>
            </div>

            <div className="col-6">
              <strong>License</strong>
              <p>{doctor.doctorLicence}</p>
            </div>

            <div className="col-6">
              <strong>Experience</strong>
              <p>{doctor.experience} Years</p>
            </div>

            <div className="col-6">
              <strong>Gender</strong>
              <p>{doctor.gender}</p>
            </div>

            <div className="col-6">
              <strong>Mobile</strong>
              <p>{doctor.doctorMobileNumber}</p>
            </div>

            <div className="col-6">
              <strong>Email</strong>
              <p>{doctor.doctorEmail}</p>
            </div>

            <div className="col-6">
              <strong>Hospital</strong>
              <p>{doctor.hospitalName}</p>
            </div>

            <div className="col-6">
              <strong>Branch</strong>
              <p>{doctor.branchName || doctor.branchId}</p>
            </div>

            <div className="col-6">
              <strong>Available Days</strong>
              <p>{doctor.availableDays}</p>
            </div>

            <div className="col-6">
              <strong>Available Time</strong>
              <p>{doctor.availableTimes}</p>
            </div>

            <div className="col-12">
              <strong>Address</strong>
              <p>{doctor.address}</p>
            </div>

            <div className="col-12">
              <strong>About Doctor</strong>
              <p>{doctor.aboutDoctor}</p>
            </div>

            <div className="col-12">
              <strong>Qualification</strong>
              <p>{doctor.qualification}</p>
            </div>

            <div className="col-12">
              <strong>Area Of Expertise</strong>
              <p>{doctor.areaOfExpertise}</p>
            </div>

          </div>
        </CModalBody>
      </CModal>


    </div>
  );
};

export default BookingDetails;