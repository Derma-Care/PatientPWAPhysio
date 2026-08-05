import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Phone, User,
  FileText, Activity, ChevronRight, ChevronDown, Stethoscope,
  CreditCard, Clipboard, FileSearch, Download, Home,
  Star, Shield, AlertCircle, CheckCircle, TrendingUp,
  Building2, Eye,
  BadgeIndianRupee,
  ImageIcon,
  ClipboardList,
  PersonStanding,
} from 'lucide-react';
import { customerService, clinicService, physiotherapyService, IMAGE_BASE_URL, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import '../styles/theme.css'; // ← shared theme
import { CButton, CModal, CModalBody, CModalHeader, CModalTitle } from '@coreui/react';
import DoctorModal from './DoctorModal';
import { body } from 'framer-motion/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  const [openAccordion, setOpenAccordion] = useState("case");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewFiles, setPreviewFiles] = useState([]);

  const [previewIndex, setPreviewIndex] = useState(0);

  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryList, setRecoveryList] = useState([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleOpenRecoveryModal = async (supportItems) => {
    setRecoveryModalVisible(true);
    setRecoveryLoading(true);
    try {
      const promises = supportItems.map(item =>
        fetch(`${BASE_URL}/clinic-admin/getRecoverySupportById/${item.id}`)
          .then(r => r.json())
          .then(json => json.success ? json.data : null)
      );
      const results = await Promise.all(promises);
      setRecoveryList(results.filter(Boolean));
    } catch (e) {
      console.error("Error fetching recovery supports:", e);
    }
    setRecoveryLoading(false);
  };
  const toggleAccordion = (section) => {
    setOpenAccordion(prev => prev === section ? null : section);
  };

  const openPreview = (url, type = "image") => {
    setPreviewFile(url);
    setPreviewType(type);
  };
  const openPreviewModal = (files, index = 0) => {
    const resolvedFiles = (files || []).map(f => resolveFileUrl(f, 'application/pdf'));
    setPreviewFiles(resolvedFiles);
    setPreviewIndex(index);
    setPreviewOpen(true);
  };
  const nextFile = () => {

    if (previewIndex < previewFiles.length - 1) {

      setPreviewIndex(prev => prev + 1);
    }
  };

  const prevFile = () => {

    if (previewIndex > 0) {

      setPreviewIndex(prev => prev - 1);
    }
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
  /**
   * Fix double-encoded S3 URLs.
   * Backend sometimes stores a full presigned URL as the S3 key, producing:
   *   https://bucket.s3.../https%3A%2F%2Fbucket.s3...%2Factual-key?outerSigning
   * This extracts the inner presigned URL which is the real, working one.
   */
  const cleanS3Url = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      // The pathname (without leading /) is the S3 key
      const key = parsed.pathname.slice(1);
      // Decode the key — if it starts with http then the key IS a presigned URL
      const decodedKey = decodeURIComponent(key);
      if (decodedKey.startsWith('https://') || decodedKey.startsWith('http://')) {
        return decodedKey; // Return the inner presigned URL directly
      }
    } catch (e) { /* not a valid URL, ignore */ }
    return url;
  };

  /** Returns a usable URL for any file value (S3 URL or legacy base64). */
  const resolveFileUrl = (file, mimeType = 'image/jpeg') => {
    if (!file) return '';
    // Already an HTTP(S) URL — clean up double-encoding, then use directly
    if (file.startsWith('http://') || file.startsWith('https://')) return cleanS3Url(file);
    // data URI — use directly
    if (file.startsWith('data:')) return file;
    // Legacy base64 — decode to blob URL
    try {
      const cleaned = file.includes('base64,') ? file.split('base64,')[1] : file;
      const byteCharacters = atob(cleaned);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      return URL.createObjectURL(new Blob([byteNumbers], { type: mimeType }));
    } catch (e) {
      console.error('resolveFileUrl error:', e);
      return '';
    }
  };

  /** True when the value is an S3/HTTP URL (not a blob: or data: that we own) */
  const isHttpUrl = (url) => url?.startsWith('http://') || url?.startsWith('https://');

  /** Download any file (S3 URL or blob URL) by fetching it as a blob first */
  const handleFileDownload = async (url, filename) => {
    try {
      if (isHttpUrl(url)) {
        // For S3 URLs, fetch as blob to bypass cross-origin download restrictions
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Download failed');
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        // blob: or data: URL — direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('handleFileDownload error:', e);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const attachmentUrls = React.useMemo(() => {
    return booking?.attachments?.map((file) => resolveFileUrl(file)) || [];
  }, [booking?.attachments]);

  const partImageUrl = React.useMemo(() => {
    return booking?.partImage ? resolveFileUrl(booking.partImage) : '';
  }, [booking?.partImage]);

  const pdfUrl = React.useMemo(() => {
    return booking?.consentFormPdf ? resolveFileUrl(booking.consentFormPdf, 'application/pdf') : '';
  }, [booking?.consentFormPdf]);

  useEffect(() => {
    return () => {
      // Only revoke blob: URLs that we created — S3 URLs don't need revoking
      attachmentUrls.filter(u => u.startsWith('blob:')).forEach(u => URL.revokeObjectURL(u));
      if (partImageUrl?.startsWith('blob:')) URL.revokeObjectURL(partImageUrl);
      if (pdfUrl?.startsWith('blob:')) URL.revokeObjectURL(pdfUrl);
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

  /** Build a usable URL for a report file (S3 key, presigned URL, or base64) */
  const getReportUrl = (report) => {
    const rawKey = report.reportFile?.[0];
    if (!rawKey) return '';
    // If the value is already a full URL (presigned), resolve it directly
    if (rawKey.startsWith('http://') || rawKey.startsWith('https://')) {
      return resolveFileUrl(rawKey, 'application/pdf');
    }
    // It's an S3 key like "booking-reports/xxx.pdf" — prepend bucket base
    return `${rawKey}`;
  };

  const navHistory = (extra = {}) => navigate(
    `/bookings/${booking.bookingId}/history?patientId=${booking.patientId}&doctorId=${visitDoctorId}&clinicId=${booking.clinicId || ''}&branchId=${booking.branchId || ''}`,
    extra,
  );

  // Resolves the doctor avatar to a usable src string.
  // Cases handled:
  //  1. No picture → initials avatar
  //  2. S3 URL whose KEY is a base64 data URI (data%3Aimage... in path) → extract data URI
  //  3. Normal S3 / HTTP URL → use directly (browser loads it)
  const getDoctorAvatar = (pic, name) => {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '')}&background=1B4F8A&color=fff&bold=true&size=200`;
    if (!pic) return fallback;

    // Case 2: backend accidentally stored the data URI as the S3 object key
    // URL looks like: https://bucket.s3.../data%3Aimage%2Fjpeg%3Bbase64%2CABC123...
    // or:             https://bucket.s3.../data:image/jpeg;base64,ABC123...
    const hasEncodedDataUri = pic.includes('data%3Aimage') || pic.includes('data%3aimage');
    const hasRawDataUri = /\/data:image\//i.test(pic);
    if (hasEncodedDataUri || hasRawDataUri) {
      try {
        const decoded = decodeURIComponent(pic);
        const idx = decoded.indexOf('data:image/');
        if (idx !== -1) {
          const extracted = decoded.slice(idx);
          if (extracted.startsWith('data:image/')) return extracted;
        }
      } catch (e) { }
      return fallback;
    }

    // Case 3: normal URL
    return pic;
  };

  const doctorAvatarFallback = doctor
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.doctorName || '')}&background=1B4F8A&color=fff&bold=true&size=200`
    : '';
  const doctorAvatar = doctor ? getDoctorAvatar(doctor.doctorPicture, doctor.doctorName) : '';

  const getImageSrc = (file) => {
    if (!file) return "";

    if (file.startsWith("data:")) {
      return file;
    }

    return `data:image/jpeg;base64,${file}`;
  };



  const downloadZip = async (files) => {

    const zip = new JSZip();

    for (let i = 0; i < files.length; i++) {
      const url = resolveFileUrl(files[i], 'application/pdf');
      const response = await fetch(url);

      const blob = await response.blob();

      zip.file(`Report-${i + 1}.pdf`, blob);
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob'
    });

    saveAs(zipBlob, 'Reports.zip');
  };

  const handleFeedback = (patient) => {
    console.log(patient);
    navigate("/patient-feedback", {
      state: {
        patientId: patient.patientId,
        patientName: patient.patientName,
        patientPhone: patient.patientPhone,
        clinicId: patient.clinicId,
        branchId: patient.branchId
      }
    });
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
              onError={(e) => { e.target.onerror = null; e.target.src = doctorAvatarFallback; }}
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
            <div className="d-flex justify-content-center gap-2">
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
              {
                (booking.status.toLowerCase() === "completed" || booking.status.toLowerCase() === "in-progress") && (
                  <div style={{ display: 'flex', justifyContent: 'end', marginBottom: "20px" }}>
                    <button className="app-btn-payment" onClick={() =>
                      handleFeedback({
                        patientId: booking.patientId,
                        patientName: booking.name,
                        patientPhone: booking.patientMobileNumber,
                        clinicId: booking.clinicId,
                        branchId: booking.branchId
                      })
                    }>
                      < Star size={12} />  Give Feedback
                    </button>

                  </div>
                )
              }
            </div>
            {/* Case Information */}
            <div className="app-card">
              <div className="app-card-header" onClick={() => toggleAccordion('case')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-navy"><FileText size={20} /></div>
                  <div>
                    <p className="app-card-title">Case Information</p>
                    <p className="app-card-sub">Appointment & patient details</p>
                  </div>
                </div>
                {openAccordion === 'case' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
              {openAccordion === 'case' && (
                <div className="app-card-body">
                  <div className="app-info-grid">
                    <InfoItem icon={Calendar} label="Service Date" value={booking.serviceDate} iconColor="var(--c-navy)" />
                    <InfoItem icon={Clock} label="Time Slot" value={booking.servicetime} iconColor="var(--c-info)" />
                    <InfoItem icon={MapPin} label="Clinic Branch" value={booking.branchname} iconColor="var(--c-warning)" />
                    <InfoItem icon={Activity} label="Chief Complaint" value={booking.problem || 'Not specified'} iconColor="var(--c-danger)" />
                    <InfoItem icon={User} label="Patient" value={booking.name}
                      sub={`${booking.age} Yrs · ${booking.gender}`} iconColor="var(--c-success)" />
                    <InfoItem icon={Phone} label="Contact" value={booking.patientMobileNumber} iconColor="var(--c-purple)" />

                    {booking?.parts?.length > 0 && (

                      <InfoItem icon={PersonStanding} label="Affected Parts" value={booking.parts.map((part, idx) => (
                        <div className="pd-tag part" key={idx}>
                          {part}
                        </div>
                      ))} iconColor="var(--c-purple)" />

                    )}

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
              )}






              <div className="  mt-3">

                <div className="app-card-header" onClick={() => toggleAccordion('attachments')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  {openAccordion === 'attachments' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                {openAccordion === 'attachments' && (
                  <div className="app-card-body">

                    <div className="pd-file-list">

                      {/* ATTACHMENTS */}
                      {attachmentUrls.map((url, idx) => {
                        // Detect file type from URL or raw attachment value
                        const rawFile = booking?.attachments?.[idx] || '';
                        const isPdf = /\.pdf(\?|$)/i.test(url) || /\.pdf(\?|$)/i.test(rawFile);
                        const fileType = isPdf ? 'pdf' : 'image';
                        const fileExt = isPdf ? 'pdf' : 'jpg';

                        return (
                          <div className="pd-file-row" key={idx}>

                            <div className="pd-file-left">
                              <div className={`pd-file-icon ${isPdf ? 'pdf' : 'image'}`}>
                                {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                              </div>

                              <div>
                                <h6>Attachment {idx + 1}</h6>
                                <p>{isPdf ? 'PDF Document' : 'Image File'}</p>
                              </div>
                            </div>

                            <div className="pd-file-actions">
                              <button
                                className="pd-file-btn view"
                                onClick={() => openPreview(url, fileType)}
                              >
                                View
                              </button>

                              <button
                                className="pd-file-btn download"
                                onClick={() => handleFileDownload(url, `attachment-${idx + 1}.${fileExt}`)}
                              >
                                Download
                              </button>
                            </div>

                          </div>
                        );
                      })}

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
                              onClick={() => openPreview(partImageUrl, 'image')}
                            >
                              View
                            </button>

                            <button
                              className="pd-file-btn download"
                              onClick={() => handleFileDownload(partImageUrl, 'part-image.jpg')}
                            >
                              Download
                            </button>
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
                              onClick={() => openPreview(pdfUrl, 'pdf')}
                            >
                              View
                            </button>

                            <button
                              className="pd-file-btn download"
                              onClick={() => handleFileDownload(pdfUrl, 'consent-form.pdf')}
                            >
                              Download
                            </button>
                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>

              {booking?.theraphyAnswers &&
                Object.entries(booking.theraphyAnswers).map(([part, questions]) => (

                  <div className=" mt-3" key={part}>

                    <div className="app-card-header" onClick={() => toggleAccordion(`therapy-${part}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* <div className="app-card-title">
                        <ClipboardList size={18} className='app-icon-box app-icon-sky' />

                        <p className="app-card-title">
                          {part} Therapy Questions
                        </p>
                      </div> */}

                      <div className="app-card-header-left"  >
                        <div className="app-icon-box app-icon-sky"   >
                          <ClipboardList size={18} />
                        </div>

                        <div>
                          <p className="app-card-title">
                            {part} Therapy Questions
                          </p>

                          {/* <p className="app-card-sub">
                        Images and consent forms
                      </p> */}
                        </div>
                      </div>
                      {openAccordion === `therapy-${part}` ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {openAccordion === `therapy-${part}` && (
                      <div className="pd-qa-list p-2">

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
                    )}

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
                  <div className="  mt-3">

                    <div className="app-card-header" onClick={() => toggleAccordion('additional')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* <div className="pd-header-left">
                        <ClipboardList size={18} />
                        <span>Additional Details</span>
                      </div> */}

                      <div className="app-card-header-left"  >
                        <div className="app-icon-box app-icon-sky"   >
                          <ClipboardList size={18} />
                        </div>

                        <div>
                          <p className="app-card-title">
                            Additional Details
                          </p>

                          {/* <p className="app-card-sub">
                        Images and consent forms
                      </p> */}
                        </div>
                      </div>

                      {openAccordion === 'additional' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>

                    {openAccordion === 'additional' && (
                      <div className="pd-info-grid p-2">

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


                      </div>
                    )}

                  </div>
                )}
              {/* Reports */}
              <div className="  mt-3">
                <div className="app-card-header" onClick={() => toggleAccordion('reports')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="app-card-header-left">
                    <div className="app-icon-box app-icon-amber"><Clipboard size={20} /></div>
                    <div>
                      <p className="app-card-title">Reports</p>
                      {/* <p className="app-card-sub">Medical documents & clinical records</p> */}
                    </div>
                  </div>
                  {openAccordion === 'reports' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                {openAccordion === 'reports' && (
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
                          const reportUrl = getReportUrl(report);
                          return (
                            <div key={i} className={`app-report-card ${isNormal ? 'normal' : 'abnormal'}`}>
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
                              {reportUrl ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center'
                                  }}
                                >

                                  <button
                                    className="pd-file-btn view"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: 12
                                    }}
                                    onClick={(e) => {

                                      e.stopPropagation();

                                      openPreviewModal(report.reportFile);
                                    }}
                                  >
                                    <Eye size={13} />
                                  </button>

                                  <button
                                    className="pd-file-btn download"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: 12
                                    }}
                                    onClick={(e) => {

                                      e.stopPropagation();

                                      downloadZip(report.reportFile);
                                    }}
                                  >
                                    ZIP
                                  </button>

                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600
                                    }}
                                  >
                                    {report.reportFile?.length || 0} Files
                                  </span>

                                </div>
                              ) : (
                                <span className="app-report-dl" style={{ opacity: 0.4 }}><AlertCircle size={16} /></span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}



              </div>

              {/* Visit History */}
              <div className=" mt-3">
                <div className="app-card-header" onClick={() => toggleAccordion('history')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="app-card-header-left">
                    <div className="app-icon-box app-icon-sky"><TrendingUp size={20} /></div>
                    <div>
                      <p className="app-card-title">Visit History</p>
                      <p className="app-card-sub">{visitHistory.length} recorded visit{visitHistory.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {visitHistory.length > 0 && (
                        <button className="app-btn-outline-navy" onClick={(e) => { e.stopPropagation(); navHistory(); }}>
                          {/* Full History <ChevronRight size={14} /> */}
                          Full History
                        </button>
                      )}
                    </div>
                  </div>
                  {openAccordion === 'history' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}

                </div>
                {openAccordion === 'history' && (
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
                                {/* <th style={{ textAlign: 'right' }}>Actions</th> */}
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
                                          {visit.physiotherapyDoctorData?.recoverySupport?.length > 0 && (
                                            <button className="app-btn-exercises" style={{ backgroundColor: 'var(--c-info)' }} onClick={() => handleOpenRecoveryModal(visit.physiotherapyDoctorData.recoverySupport)}>
                                              <Shield size={12} /> Recovery
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {/* <button className="app-btn-ghost" onClick={() => navHistory({ state: { singleVisit: true, visit } })}>
                                    <ChevronRight size={18} />
                                  </button> */}
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
                                  {visit.physiotherapyDoctorData?.recoverySupport?.length > 0 && (
                                    <button className="app-btn-exercises" style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--c-info)' }} onClick={() => handleOpenRecoveryModal(visit.physiotherapyDoctorData.recoverySupport)}>
                                      <Shield size={12} /> Recovery
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
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
            visible={previewOpen}
            onClose={() => setPreviewOpen(false)}
            alignment="center"
            size="lg"
          >
            <CModalHeader>
              <CModalTitle>
                Report Preview ({previewFiles.length > 0 ? previewIndex + 1 : 0} / {previewFiles.length})
              </CModalTitle>
            </CModalHeader>
            <CModalBody>
              <div style={{ textAlign: 'center' }}>
                <object
                  data={previewFiles[previewIndex]}
                  type="application/pdf"
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                >
                  <p>PDF preview not available.</p>
                  <CButton onClick={() => window.open(previewFiles[previewIndex], '_blank')}>
                    Open PDF
                  </CButton>
                </object>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <CButton color="secondary" onClick={prevFile} disabled={previewIndex === 0}>Prev</CButton>
                <CButton color="primary" onClick={() => handleFileDownload(previewFiles[previewIndex], `Report-${previewIndex + 1}.pdf`)}>Download</CButton>
                <CButton color="secondary" onClick={nextFile} disabled={previewIndex === previewFiles.length - 1}>Next</CButton>
              </div>
            </CModalBody>
          </CModal>
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
                <div style={{ textAlign: 'center' }}>
                  <iframe
                    src={previewFile}
                    title="PDF Preview"
                    width="100%"
                    height="600px"
                    style={{ border: "none" }}
                  />
                </div>
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
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'block');
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
                  <img
                    src={doctorAvatar}
                    alt={doctor.doctorName}
                    className="app-doc-sidebar-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = doctorAvatarFallback; }}
                  />
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

      {/* Recovery Support Modal */}
      <CModal
        visible={recoveryModalVisible}
        onClose={() => setRecoveryModalVisible(false)}
        alignment="center"
        size="lg"
        scrollable
      >
        <CModalHeader style={{ border: 'none', padding: '20px 24px 10px' }}>
          <CModalTitle style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Recovery Support
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ padding: '20px 24px', background: 'var(--c-surface-2)' }}>
          {recoveryLoading ? (
            <div className="text-center py-4" style={{ color: 'var(--c-text-muted)' }}>Loading details...</div>
          ) : recoveryList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {recoveryList.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--c-surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--c-border)' }}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', marginBottom: '16px', background: 'var(--c-surface-2)' }}
                    />
                  )}
                  <h5 style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--c-text)' }}>{item.name}</h5>
                  {item.category && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{
                        background: 'var(--c-navy)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {item.category}
                      </span>
                    </div>
                  )}
                  <p style={{ fontSize: '14px', color: 'var(--c-text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: 'var(--c-text-muted)' }}>No recovery support items found.</div>
          )}
        </CModalBody>
      </CModal>

    </div>
  );
};

export default BookingDetails;