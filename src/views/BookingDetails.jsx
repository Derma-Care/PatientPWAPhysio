import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, User,
  FileText, Activity, ChevronRight, Stethoscope,
  CreditCard, Clipboard, FileSearch, Download, Home,
  Star, Shield, AlertCircle, CheckCircle, TrendingUp,
  Building2,
  BadgeIndianRupee,
  ImageIcon,
  ClipboardList,
} from 'lucide-react';
import { customerService, clinicService, physiotherapyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import '../styles/theme.css'; // ← shared theme
import { CButton, CModal, CModalBody, CModalHeader, CModalTitle } from '@coreui/react';
import DoctorModal from './DoctorModal';

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
  const [previewFile, setPreviewFile] = useState("");
  const [previewType, setPreviewType] = useState("");

  const openPreview = (url, type = "image") => {
    setPreviewFile(url);
    setPreviewType(type);
  };
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

  const openPdf = (base64) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };
  const createBlobUrl = (base64, type = "image/jpeg") => {
    try {
      const cleaned = base64.includes("base64,")
        ? base64.split("base64,")[1]
        : base64;

      const byteCharacters = atob(cleaned);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type });

      return URL.createObjectURL(blob);
    } catch (e) {
      console.error(e);
      return "";
    }
  };
  const attachmentUrls = React.useMemo(() => {
    return booking?.attachments?.map((file) =>
      createBlobUrl(file)
    ) || [];
  }, [booking?.attachments]);

  const partImageUrl = React.useMemo(() => {
    return booking?.partImage
      ? createBlobUrl(booking.partImage)
      : "";
  }, [booking?.partImage]);

  const pdfUrl = React.useMemo(() => {
    return booking?.consentFormPdf
      ? createBlobUrl(
        booking.consentFormPdf,
        "application/pdf"
      )
      : "";
  }, [booking?.consentFormPdf]);

  useEffect(() => {
    return () => {

      attachmentUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      if (partImageUrl) {
        URL.revokeObjectURL(partImageUrl);
      }

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

    };
  }, []);

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
  const getImageSrc = (file) => {
    if (!file) return "";

    if (file.startsWith("data:")) {
      return file;
    }

    return `data:image/jpeg;base64,${file}`;
  };



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
            {
              booking.status.toLowerCase() !== "confirmed" && (
                <div style={{ display: 'flex', justifyContent: 'end', marginBottom: "20px" }}>
                  <button className="app-btn-payment" onClick={() =>
                    navigate(`/payment/${booking.bookingId}`)
                  }>
                    < BadgeIndianRupee size={12} /> View Payment Details
                  </button>

                </div>
              )}
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






              <div className="app-card mt-3">

                <div className="app-card-header">
                  <div className="app-card-header-left">
                    <div className="app-icon-box app-icon-sky">
                      <ImageIcon size={18} />
                    </div>

                    <div>
                      <p className="app-card-title">
                        Attachments & Files
                      </p>

                      <p className="app-card-sub">
                        Images and consent forms
                      </p>
                    </div>
                  </div>
                </div>

                <div className="app-card-body">

                  <div className="pd-file-list">

                    {/* ATTACHMENTS */}
                    {attachmentUrls.map((url, idx) => (
                      <div className="pd-file-row" key={idx}>

                        <div className="pd-file-left">
                          <div className="pd-file-icon image">
                            <ImageIcon size={16} />
                          </div>

                          <div>
                            <h6>Attachment {idx + 1}</h6>
                            <p>Image File</p>
                          </div>
                        </div>

                        <div className="pd-file-actions">
                          <button
                            className="pd-file-btn view"
                            onClick={() => openPreview(url)}
                          >
                            View
                          </button>

                          <a
                            href={url}
                            download={`attachment-${idx + 1}.jpg`}
                            className="pd-file-btn download"
                          >
                            Download
                          </a>
                        </div>

                      </div>
                    ))}

                    {/* PART IMAGE */}
                    {partImageUrl && (
                      <div className="pd-file-row">

                        <div className="pd-file-left">
                          <div className="pd-file-icon body">
                            <Activity size={16} />
                          </div>

                          <div>
                            <h6>Body Part Image</h6>
                            <p>Injury Area</p>
                          </div>
                        </div>

                        <div className="pd-file-actions">
                          <button
                            className="pd-file-btn view"
                            onClick={() => openPreview(partImageUrl)}
                          >
                            View
                          </button>

                          <a
                            href={partImageUrl}
                            download="part-image.jpg"
                            className="pd-file-btn download"
                          >
                            Download
                          </a>
                        </div>

                      </div>
                    )}

                    {/* PDF */}
                    {pdfUrl && (
                      <div className="pd-file-row">

                        <div className="pd-file-left">
                          <div className="pd-file-icon pdf">
                            <FileText size={16} />
                          </div>

                          <div>
                            <h6>Consent Form</h6>
                            <p>PDF Document</p>
                          </div>
                        </div>

                        <div className="pd-file-actions">
                          <button
                            className="pd-file-btn view"
                            onClick={() =>
                              openPreview(pdfUrl, "pdf")
                            }
                          >
                            View
                          </button>

                          <a
                            href={pdfUrl}
                            download="consent-form.pdf"
                            className="pd-file-btn download"
                          >
                            Download
                          </a>
                        </div>

                      </div>
                    )}

                  </div>

                </div>

              </div>

              {booking?.theraphyAnswers &&
                Object.entries(booking.theraphyAnswers).map(([part, questions]) => (

                  <div className="pd-section mt-3" key={part}>

                    <div className="pd-section-header">
                      <div className="pd-header-left">
                        <ClipboardList size={18} />
                        <span>{part} Therapy Questions</span>
                      </div>
                    </div>

                    <div className="pd-qa-list">

                      {questions.map((item, idx) => (
                        <div className="pd-qa-card" key={idx}>

                          <p className="pd-question">
                            {item.question}
                          </p>

                          <span
                            className={`pd-answer-pill ${item.answer === "YES"
                              ? "yes"
                              : item.answer === "NO"
                                ? "no"
                                : "normal"
                              }`}
                          >
                            {item.answer}
                          </span>

                        </div>
                      ))}

                    </div>

                  </div>
                ))}


              {booking?.reasonForCancel && (
                <div className="pd-cancel-box">
                  <AlertCircle size={16} />

                  <div>
                    <h6>Cancellation Reason</h6>
                    <p>{booking.reasonForCancel}</p>
                  </div>
                </div>
              )}

              {(
                booking?.referredByType ||
                booking?.referredByName ||
                booking?.previousInjuries ||
                booking?.currentMedications ||
                booking?.allergies ||
                booking?.occupation ||
                booking?.insuranceProvider ||
                booking?.policyNumber ||
                booking?.activityLevels?.length > 0 ||
                booking?.reasonforVisit ||
                booking?.parts?.length > 0
              ) && (
                  <div className="pd-section mt-3">

                    <div className="pd-section-header">
                      <div className="pd-header-left">
                        <ClipboardList size={18} />
                        <span>Additional Details</span>
                      </div>
                    </div>

                    <div className="pd-info-grid">

                      {/* REFERRED BY */}
                      {booking?.referredByType && (
                        <div className="pd-info-card">
                          <span>Referred By Type</span>
                          <h6>{booking.referredByType}</h6>
                        </div>
                      )}

                      {booking?.referredByName && (
                        <div className="pd-info-card">
                          <span>Referred By Name</span>
                          <h6>{booking.referredByName}</h6>
                        </div>
                      )}

                      {/* PREVIOUS INJURIES */}
                      {booking?.previousInjuries && (
                        <div className="pd-info-card">
                          <span>Previous Injuries</span>
                          <h6>{booking.previousInjuries}</h6>
                        </div>
                      )}

                      {/* CURRENT MEDICATIONS */}
                      {booking?.currentMedications && (
                        <div className="pd-info-card">
                          <span>Current Medications</span>
                          <h6>{booking.currentMedications}</h6>
                        </div>
                      )}

                      {/* ALLERGIES */}
                      {booking?.allergies && (
                        <div className="pd-info-card">
                          <span>Allergies</span>
                          <h6>{booking.allergies}</h6>
                        </div>
                      )}

                      {/* OCCUPATION */}
                      {booking?.occupation && (
                        <div className="pd-info-card">
                          <span>Occupation</span>
                          <h6>{booking.occupation}</h6>
                        </div>
                      )}

                      {/* INSURANCE */}
                      {booking?.insuranceProvider && (
                        <div className="pd-info-card">
                          <span>Insurance Provider</span>
                          <h6>{booking.insuranceProvider}</h6>
                        </div>
                      )}

                      {booking?.policyNumber && (
                        <div className="pd-info-card">
                          <span>Policy Number</span>
                          <h6>{booking.policyNumber}</h6>
                        </div>
                      )}

                      {/* REASON */}
                      {booking?.reasonforVisit && (
                        <div className="pd-info-card">
                          <span>Reason For Visit</span>
                          <h6>{booking.reasonforVisit}</h6>
                        </div>
                      )}

                      {/* ACTIVITY LEVEL */}
                      {booking?.activityLevels?.length > 0 && (
                        <div className="pd-info-card">
                          <span>Activity Levels</span>

                          <div className="pd-tag-wrap">
                            {booking.activityLevels.map((item, idx) => (
                              <div className="pd-tag" key={idx}>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BODY PARTS */}
                      {booking?.parts?.length > 0 && (
                        <div className="pd-info-card">
                          <span>Affected Parts</span>

                          <div className="pd-tag-wrap">
                            {booking.parts.map((part, idx) => (
                              <div className="pd-tag part" key={idx}>
                                {part}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}
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
                            <th>#</th><th>Visit</th><th>Date & Time</th>
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
                              {/* <td>
                                <span className="app-diag-badge">
                                  {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis || 'N/A'}
                                </span>
                              </td> */}
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/bookings/${booking.bookingId}/visit-details`, { state: { singleVisit: true, visit } })}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <div className="app-visit-num">{idx + 1}</div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{visit.visitNumber}</div>
                                <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{visit.visitDate} · {visit.visitTime}</div>
                              </div>
                            </div>
                            <ChevronRight size={16} color="var(--c-text-3)" style={{ flexShrink: 0 }} />
                          </div>
                          {/* {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis && (
                            <div style={{ borderTop: '1px solid var(--c-border)', marginTop: 10, paddingTop: 10 }}>
                              <div style={{ fontSize: 10, color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 3 }}>Diagnosis</div>
                              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {visit.physiotherapyDoctorData.diagnosis.physioDiagnosis}
                              </div>
                            </div>
                          )} */}
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

          {/* <button
            className="btn btn-success w-100 mt-3"
            onClick={() =>
              navigate(`/payment/${booking.bookingId}`)
            }
          >
            View Payment Details
          </button> */}
          <CModal
            visible={!!previewFile}
            onClose={() => setPreviewFile("")}
            alignment="center"
            size="lg"
          >

            <CModalHeader>
              <CModalTitle>
                File Preview
              </CModalTitle>
            </CModalHeader>

            <CModalBody>

              {previewType === "pdf" ? (
                <iframe
                  src={previewFile}
                  title="PDF Preview"
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                />
              ) : (
                <img
                  src={previewFile}
                  alt="preview"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    maxHeight: "80vh",
                    objectFit: "contain"
                  }}
                />
              )}

            </CModalBody>

          </CModal>
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
      {
        showDoctorModal && <DoctorModal

          visible={showDoctorModal}
          onClose={() => setShowDoctorModal(false)}
          alignment="center"
          size="lg"
          doctor={doctor}
          doctorAvatar={doctorAvatar}
        />
      }



    </div>
  );
};

export default BookingDetails;