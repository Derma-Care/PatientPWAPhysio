import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CSpinner,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CModal, CModalHeader, CModalTitle, CModalBody,
} from '@coreui/react';
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  PlayCircle,
  Video,
  Image as ImageIcon,
  Download,
  Calendar,
  Clock,
} from 'lucide-react';
import { physiotherapyService, customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import appLogo from '/kinetix-logo.png';
/* ── Media Preview Modal ─────────────────────────────────────── */
const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  const isYouTube =
    type === 'youtube' ||
    mediaUrl.includes('youtube.com') ||
    mediaUrl.includes('youtu.be');

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      alignment="center"
      backdrop="static"
    >
      <CModalHeader className="border-0 px-4 pt-4 pb-0">
        <CModalTitle className="fw-bold d-flex align-items-center gap-2">
          {isYouTube ? (
            <PlayCircle size={20} className="text-danger" />
          ) : type === 'pdf' ? (
            <FileText size={20} style={{ color: 'var(--c-navy)' }} />
          ) : type === 'video' ? (
            <Video size={20} />
          ) : (
            <ImageIcon size={20} />
          )}
          {isYouTube
            ? 'Exercise Tutorial'
            : type === 'pdf'
              ? 'Document Preview'
              : type === 'video'
                ? 'Video Update'
                : 'Media Preview'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody
        className="p-0 rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center mt-3"
        style={{
          minHeight: 350,
          height: type === 'pdf' ? '75vh' : 'auto',
          background: type === 'pdf' ? 'var(--c-surface-2)' : '#000',
        }}
      >
        {isYouTube ? (
          <iframe
            width="100%"
            height="350"
            src={`https://www.youtube.com/embed/${getYouTubeId(mediaUrl)}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : type === 'pdf' ? (
          <iframe
            src={mediaUrl}
            width="100%"
            height="100%"
            title="PDF Preview"
            style={{ border: 'none', minHeight: '75vh' }}
          />
        ) : type === 'video' ? (
          <video
            src={mediaUrl}
            controls
            className="w-100"
            style={{ maxHeight: '70vh' }}
            autoPlay
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Preview"
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        )}
      </CModalBody>
    </CModal>
  );
};

/* ── VisitHistory ────────────────────────────────────────────── */
const VisitHistory = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState({ visible: false, url: '', type: '' });
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [loadingDownloadId, setLoadingDownloadId] = useState(null);

  const urlParams = new URLSearchParams(location.search);
  const urlPatientId = urlParams.get('patientId');
  const urlClinicId = urlParams.get('clinicId') || '';
  const urlBranchId = urlParams.get('branchId') || '';
  const urlDoctorId = urlParams.get('doctorId') || '';
  const hospitalData = JSON.parse(localStorage.getItem('selectedHospital') || '{}');
  const hospitalName = hospitalData?.name || hospitalData?.clinicName || 'PhysioElite';
  const hospitalLogo = hospitalData?.hospitalLogo
    ? `data:image/webp;base64,${hospitalData.hospitalLogo}`
    : appLogo;
  useEffect(() => {
    const abortController = new AbortController();

    const fetchHistory = async () => {
      try {
        let patientId = urlPatientId;
        let clinicId = urlClinicId;
        let branchId = urlBranchId;
        let doctorId = urlDoctorId;

        setLoading(true);

        if (location.state?.singleVisit && location.state?.visit) {
          if (!abortController.signal.aborted) setHistory([location.state.visit]);
          return;
        }

        if (!patientId && user?.customerId) {
          const bookingsRes = await customerService.getBookings(user.customerId);
          const currentBooking = bookingsRes.data?.find((b) => b.bookingId === id);
          if (currentBooking) {
            patientId = currentBooking.patientId;
            clinicId = clinicId || currentBooking.clinicId || '';
            branchId = branchId || currentBooking.branchId || '';
            doctorId = doctorId || currentBooking.doctorId || '';
          }
        }

        if (!patientId || !id) { setHistory([]); return; }

        if (!doctorId) {
          try {
            const firstVisitRes = await physiotherapyService.getVisitHistory({
              doctorId: '', patientId, bookingId: id, clinicId, branchId,
            });
            const firstData = firstVisitRes.data;
            const firstVisit = Array.isArray(firstData) ? firstData[0] : firstData;
            doctorId = firstVisit?.physiotherapyDoctorData?.treatmentPlan?.doctorId || '';
          } catch (e) {
            console.warn('Could not extract doctorId from first visit:', e);
          }
        }

        const response = await physiotherapyService.getFullVisitHistory({
          doctorId, patientId, bookingId: id,
        });
        if (!abortController.signal.aborted) {
          const resData = response.data;
          setHistory(resData ? (Array.isArray(resData) ? resData : [resData]) : []);
        }
      } catch (error) {
        if (!abortController.signal.aborted) console.error('Error fetching visit history:', error);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    };

    fetchHistory();
    return () => abortController.abort();
  }, [id, location.search, user]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="app-loading">
        <img src={hospitalLogo} className="logo-spinner-grow" alt="Loading..." />
      </div>
    );
  }

  return (
    <div className="app-page">

      {/* ── Hero ── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          <h2 className="app-hero-title">Visit History</h2>
          <p className="app-hero-sub">Detailed records of your therapy visits</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="app-body">

        {history.length > 0 ? (
          <>
            {/* Summary count strip */}
            <div
              className="app-card d-flex align-items-center gap-2 mb-2"
              style={{ padding: '10px 16px' }}
            >
              <ClipboardList size={15} style={{ color: 'var(--c-navy)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>
                {history.length} Visit{history.length !== 1 ? 's' : ''} Recorded
              </span>
            </div>

            <CAccordion flush>
              {history.map((visit, idx) => (
                <div
                  className="app-card"
                  key={idx}
                  style={{ padding: 0, marginBottom: 10 }}
                >
                  <CAccordionItem itemKey={idx}>

                    {/* ── Accordion Header ── */}
                    <CAccordionHeader>
                      <div
                        className="w-100 d-flex align-items-center gap-3 pe-2"
                        style={{ minWidth: 0 }}
                      >
                        {/* Visit number badge */}
                        <div className="app-visit-num" style={{ flexShrink: 0 }}>
                          {idx + 1}
                        </div>

                        {/* Visit info */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="app-card-title" style={{ marginBottom: 3 }}>
                            Visit #{visit.visitNumber}
                          </p>
                          <p
                            className="app-card-sub"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                          >
                            <Calendar size={11} />
                            {visit.visitDate}
                            <Clock size={11} style={{ marginLeft: 2 }} />
                            {visit.visitTime}
                          </p>
                        </div>

                        {/* PDF indicator chip — only if report exists */}
                        {(visit.prescriptionPdf ||
                          visit.reportPdf ||
                          visit.physiotherapyDoctorData?.prescriptionPdf ||
                          visit.physiotherapyDoctorData?.reportPdf) && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'var(--c-navy-soft, #eef2ff)',
                                color: 'var(--c-navy)',
                                borderRadius: 20,
                                padding: '3px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <FileText size={11} />
                              Report
                            </div>
                          )}
                      </div>
                    </CAccordionHeader>

                    {/* ── Accordion Body ── */}
                    <CAccordionBody style={{ padding: '0 0 4px' }}>
                      <div style={{ padding: '8px 16px 20px' }}>

                        {/* Divider */}
                        <div
                          style={{
                            height: 1,
                            background: 'var(--c-border, #e9ecef)',
                            marginBottom: 16,
                          }}
                        />

                        {/* Prescription / Report File */}
                        {(() => {
                          const pdfData =
                            visit.prescriptionPdf ||
                            visit.reportPdf ||
                            visit.physiotherapyDoctorData?.prescriptionPdf ||
                            visit.physiotherapyDoctorData?.reportPdf;

                          if (!pdfData) return (
                            <div
                              className="d-flex flex-column align-items-center justify-content-center gap-2"
                              style={{
                                padding: '28px 0',
                                color: 'var(--c-text-3, #adb5bd)',
                              }}
                            >
                              <FileText size={36} strokeWidth={1.2} />
                              <p style={{ fontSize: 13, margin: 0 }}>No documents for this visit</p>
                            </div>
                          );

                          const openPdf = async () => {
                            try {
                              let url;
                              if (pdfData.startsWith('http://') || pdfData.startsWith('https://')) {
                                url = pdfData;
                              } else {
                                const base64String = pdfData.includes('base64,')
                                  ? pdfData.split('base64,')[1] : pdfData;
                                const cleanBase64 = base64String.replace(/\s/g, '');
                                const res = await fetch(`data:application/pdf;base64,${cleanBase64}`);
                                const blob = await res.blob();
                                url = URL.createObjectURL(blob);
                              }
                              return url;
                            } catch (error) {
                              console.error('Error opening PDF:', error);
                              alert('Failed to open PDF document.');
                              return null;
                            }
                          };

                          return (
                            <div
                              className="app-card"
                              style={{
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                              }}
                            >
                              {/* Left — icon + label */}
                              <div className="d-flex align-items-center gap-3">
                                <div className="app-report-icon app-icon-navy">
                                  <FileText size={18} />
                                </div>
                                <div>
                                  <p className="app-report-name" style={{ marginBottom: 2 }}>
                                    Prescription / Report
                                  </p>
                                  <p className="app-report-meta">
                                    Visit #{visit.visitNumber}
                                  </p>
                                </div>
                              </div>

                              {/* Right — action buttons */}
                              <div className="d-flex gap-2">
                                <button
                                  className="app-btn-navy"
                                  style={{ padding: '7px 14px', fontSize: 12 }}
                                  disabled={loadingPdfId === visit.visitNumber}
                                  onClick={async () => {
                                    setLoadingPdfId(visit.visitNumber);
                                    const url = await openPdf();
                                    setLoadingPdfId(null);
                                    if (url) setPreviewData({ visible: true, url, type: 'pdf' });
                                  }}
                                >
                                  {loadingPdfId === visit.visitNumber ? (
                                    <CSpinner size="sm" className="me-1" />
                                  ) : (
                                    <FileText size={13} />
                                  )}{' '}
                                  View
                                </button>

                                <button
                                  className="app-btn-orange"
                                  style={{ padding: '7px 14px', fontSize: 12 }}
                                  disabled={loadingDownloadId === visit.visitNumber}
                                  onClick={async () => {
                                    try {
                                      setLoadingDownloadId(visit.visitNumber);
                                      let url;
                                      let isBlobUrl = false;
                                      if (pdfData.startsWith('http://') || pdfData.startsWith('https://')) {
                                        url = pdfData;
                                      } else {
                                        const base64String = pdfData.includes('base64,')
                                          ? pdfData.split('base64,')[1] : pdfData;
                                        const cleanBase64 = base64String.replace(/\s/g, '');
                                        const res = await fetch(`data:application/pdf;base64,${cleanBase64}`);
                                        const blob = await res.blob();
                                        url = URL.createObjectURL(blob);
                                        isBlobUrl = true;
                                      }
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `Prescription_${visit.visitNumber || 'Visit'}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      if (isBlobUrl) URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Error downloading PDF:', error);
                                      alert('Failed to download PDF document.');
                                    } finally {
                                      setLoadingDownloadId(null);
                                    }
                                  }}
                                >
                                  {loadingDownloadId === visit.visitNumber ? (
                                    <CSpinner size="sm" className="me-1" />
                                  ) : (
                                    <Download size={13} />
                                  )}{' '}
                                  Download
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </CAccordionBody>

                  </CAccordionItem>
                </div>
              ))}
            </CAccordion>

            <MediaPreviewModal
              visible={previewData.visible}
              onClose={() => setPreviewData({ ...previewData, visible: false })}
              mediaUrl={previewData.url}
              type={previewData.type}
            />
          </>
        ) : (
          /* ── Empty state ── */
          <div className="app-empty">
            <ClipboardList size={64} />
            <p className="app-card-title" style={{ marginTop: 8 }}>No visit history found</p>
            <p className="app-card-sub">Your therapy visit records will appear here</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VisitHistory;