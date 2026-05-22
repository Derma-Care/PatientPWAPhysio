import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
  CButton,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CBadge,
} from '@coreui/react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Activity,
  FileText,
  ChevronRight,
  ClipboardList,
  Target,
  FlaskConical,
  Stethoscope,
  ChevronDown,
  Home,
  PlayCircle,
  Video,
  Image as ImageIcon,
  X,
  AlertCircle,
  Download
} from 'lucide-react';
import { physiotherapyService, customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react';

const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  const isYouTube = type === 'youtube' || mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be');

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" className="premium-modal" backdrop="static">
      <CModalHeader className="border-0 px-4 pt-4 pb-0">
        <CModalTitle className="fw-bold d-flex align-items-center gap-2">
          {isYouTube ? <PlayCircle size={20} className="text-danger" /> : (type === 'pdf' ? <FileText size={20} className="text-primary" /> : type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />)}
          {isYouTube ? 'Exercise Tutorial' : (type === 'pdf' ? 'Document Preview' : type === 'video' ? 'Video Update' : 'Media Preview')}
        </CModalTitle>
        <CButton variant="ghost" onClick={onClose} className="p-0"><X size={28} /></CButton>
      </CModalHeader>
      <CModalBody className={`p-0 ${type === 'pdf' ? 'bg-light' : 'bg-black'} rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center mt-3`} style={{ minHeight: '350px', height: type === 'pdf' ? '75vh' : 'auto' }}>
        {isYouTube ? (
          <iframe
            width="100%"
            height="350"
            src={`https://www.youtube.com/embed/${getYouTubeId(mediaUrl)}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : type === 'pdf' ? (
          <iframe src={mediaUrl} width="100%" height="100%" title="PDF Preview" style={{ border: 'none', minHeight: '75vh' }} />
        ) : type === 'video' ? (
          <video src={mediaUrl} controls className="w-100 h-100" style={{ maxHeight: '70vh' }} autoPlay />
        ) : (
          <img src={mediaUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
        )}
      </CModalBody>
    </CModal>
  );
};

const VisitHistory = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState({ visible: false, url: '', type: '' });

  // Extract all available URL params
  const urlParams = new URLSearchParams(location.search);
  const urlPatientId = urlParams.get('patientId');
  const urlClinicId = urlParams.get('clinicId') || '';
  const urlBranchId = urlParams.get('branchId') || '';
  const urlDoctorId = urlParams.get('doctorId') || '';

  useEffect(() => {
    const abortController = new AbortController();

    const fetchHistory = async () => {
      try {
        let patientId = urlPatientId;
        let clinicId = urlClinicId;
        let branchId = urlBranchId;
        let doctorId = urlDoctorId;

        setLoading(true);

        // Check if we already passed the specific visit data via location state
        if (location.state?.singleVisit && location.state?.visit) {
          if (!abortController.signal.aborted) {
            setHistory([location.state.visit]);
          }
          return;
        }

        // Fallback: get patientId from bookings if missing from URL
        if (!patientId && user?.customerId) {
          const bookingsRes = await customerService.getBookings(user.customerId);
          const currentBooking = bookingsRes.data?.find(b => b.bookingId === id);
          if (currentBooking) {
            patientId = currentBooking.patientId;
            clinicId = clinicId || currentBooking.clinicId || '';
            branchId = branchId || currentBooking.branchId || '';
            doctorId = doctorId || currentBooking.doctorId || '';
          }
        }

        if (!patientId || !id) {
          setHistory([]);
          return;
        }

        // If doctorId is missing from URL, fetch it from first-visit-history response
        if (!doctorId) {
          try {
            const firstVisitRes = await physiotherapyService.getVisitHistory({
              doctorId: '',
              patientId,
              bookingId: id,
              clinicId,
              branchId
            });
            const firstData = firstVisitRes.data;
            const firstVisit = Array.isArray(firstData) ? firstData[0] : firstData;
            doctorId = firstVisit?.physiotherapyDoctorData?.treatmentPlan?.doctorId || '';
          } catch (e) {
            console.warn('Could not extract doctorId from first visit:', e);
          }
        }

        const response = await physiotherapyService.getFullVisitHistory({
          doctorId,
          patientId,
          bookingId: id
        });
        if (!abortController.signal.aborted) {
          const resData = response.data;
          const historyArray = resData ? (Array.isArray(resData) ? resData : [resData]) : [];
          setHistory(historyArray);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching visit history:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => abortController.abort();
  }, [id, location.search, user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <img src="/favicon.png" className="logo-spinner-grow" alt="Loading..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <CButton color="link" className="p-0 text-decoration-none text-secondary mb-3 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </CButton>
        <h3 className="fw-bold text-dark m-0">Visit History</h3>
        <p className="text-secondary">Detailed records of your therapy visits</p>
      </div>

      <CRow>
        <CCol lg={10} className="mx-auto">
          {history.length > 0 ? (
            <>
              <CAccordion flush className="visit-history-accordion">
                {history.map((visit, idx) => (
                  <CAccordionItem itemKey={idx} key={idx} className="visit-accordion-item">
                  <CAccordionHeader className="visit-accordion-header">
                    <div className="w-100 d-flex justify-content-between align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="visit-number-badge">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="fw-bold text-dark visit-title">{visit.visitNumber}</div>
                          <div className="small text-secondary fw-semibold">
                            {visit.visitDate} • {visit.visitTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CAccordionHeader>
                  <CAccordionBody className="visit-accordion-body">
                    <div className="visit-details-grid">
                      {/* Section 1: Complaints & Investigation + Prescription */}
                      <div className="visit-detail-panel">
                        <div className="visit-section-card h-100">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                            <Activity size={18} className="text-danger" /> Complaints & Investigation
                          </h6>
                          <div className="mb-4">
                            <div className="text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Details</div>
                            <div className="fw-semibold text-dark p-3 bg-light rounded-3" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                              {visit.physiotherapyDoctorData?.complaints?.complaintDetails || 'No complaints recorded.'}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="text-secondary small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Tests Performed</div>
                            <div className="d-flex flex-wrap gap-2">
                              {visit.physiotherapyDoctorData?.investigation?.tests?.length > 0 ? (
                                visit.physiotherapyDoctorData.investigation.tests.map((test, i) => (
                                  <CBadge key={i} color="info" className="fw-bold px-3 py-2" style={{ fontSize: '0.8rem' }}>{test}</CBadge>
                                ))
                              ) : (
                                <span className="text-secondary small fst-italic">None recorded</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Follow-up Section */}
                        {visit.physiotherapyDoctorData?.followUp?.nextVisitDate && (
                          <div className="visit-followup-card shadow-sm">
                            <h6 className="fw-bold text-white mb-2 d-flex align-items-center gap-2">
                              <Calendar size={18} /> Next Follow-up
                            </h6>
                            <div className="d-flex justify-content-between align-items-center bg-white bg-opacity-25 rounded-3 p-2 mb-2">
                              <span className="text-white small fw-semibold">Date:</span>
                              <span className="fw-bold text-white">{visit.physiotherapyDoctorData.followUp.nextVisitDate}</span>
                            </div>
                            {visit.physiotherapyDoctorData.followUp.reviewNotes && (
                              <div className="small text-white opacity-90 p-2 border-start border-2 border-white">
                                {visit.physiotherapyDoctorData.followUp.reviewNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prescription / Report File */}
                        {(() => {
                          const pdfData = visit.prescriptionPdf || visit.reportPdf || visit.physiotherapyDoctorData?.prescriptionPdf || visit.physiotherapyDoctorData?.reportPdf;
                          if (!pdfData) return null;
                          return (
                            <div className="mt-3">
                              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                <FileText size={14} className="text-secondary" /> Prescription / Report
                              </h6>
                              <div className="d-flex gap-2">
                                <CButton
                                  className="btn-premium flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                  style={{ background: '#f43f5e', border: 'none', fontSize: '0.85rem' }}
                                  onClick={async () => {
                                    try {
                                      let url;
                                      if (pdfData.startsWith('http://') || pdfData.startsWith('https://')) {
                                        url = pdfData;
                                      } else {
                                        const base64String = pdfData.includes('base64,') ? pdfData.split('base64,')[1] : pdfData;
                                        const cleanBase64 = base64String.replace(/\s/g, '');
                                        const res = await fetch(`data:application/pdf;base64,${cleanBase64}`);
                                        const blob = await res.blob();
                                        url = URL.createObjectURL(blob);
                                      }
                                      setPreviewData({ visible: true, url, type: 'pdf' });
                                    } catch (error) {
                                      console.error('Error opening PDF:', error);
                                      alert('Failed to open PDF document. It may be corrupted or invalid.');
                                    }
                                  }}
                                >
                                  <FileText size={16} /> View
                                </CButton>
                                <CButton
                                  className="btn-premium flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                  style={{ background: '#2563eb', border: 'none', fontSize: '0.85rem' }}
                                  onClick={async () => {
                                    try {
                                      let url;
                                      let isBlobUrl = false;
                                      if (pdfData.startsWith('http://') || pdfData.startsWith('https://')) {
                                        url = pdfData;
                                      } else {
                                        const base64String = pdfData.includes('base64,') ? pdfData.split('base64,')[1] : pdfData;
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
                                    }
                                  }}
                                >
                                  <Download size={16} /> Download
                                </CButton>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Section 2: Diagnosis & Treatment Plan */}
                      <div className="visit-detail-panel">
                        <div className="visit-section-card mb-0">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                            <Stethoscope size={18} className="text-success" /> Physio Diagnosis
                          </h6>
                          <div className="mb-4">
                            <div className="fw-bold text-dark mb-3 p-3 bg-light rounded-3" style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                              {visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis || 'No diagnosis recorded.'}
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              <CBadge color="warning" className="px-3 py-2 text-dark fw-bold shadow-sm" style={{ fontSize: '0.8rem' }}>
                                Severity: {visit.physiotherapyDoctorData?.diagnosis?.severity || 'N/A'}
                              </CBadge>
                              <CBadge color="info" className="px-3 py-2 fw-bold shadow-sm" style={{ fontSize: '0.8rem' }}>
                                Stage: {visit.physiotherapyDoctorData?.diagnosis?.stage || 'N/A'}
                              </CBadge>
                            </div>
                            <div className="d-flex align-items-center gap-2 p-2 bg-light rounded-3">
                              <Target size={16} className="text-secondary" />
                              <span className="small text-secondary fw-semibold">Affected Area:</span>
                              <span className="small fw-bold text-dark">{visit.physiotherapyDoctorData?.diagnosis?.affectedArea || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="visit-section-card flex-grow-1 d-flex flex-column">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                            <FlaskConical size={18} className="text-warning" /> Treatment Plan
                          </h6>
                          <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded-3 mb-3">
                            <span className="small text-secondary fw-semibold">Therapist:</span>
                            <span className="fw-bold text-dark">{visit.physiotherapyDoctorData?.treatmentPlan?.therapistName || 'Not Assigned'}</span>
                          </div>
                          <div className="mb-3 flex-grow-1">
                            <div className="text-secondary small fw-bold text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Therapy Sessions</div>
                            <div className="d-flex flex-column gap-2">
                              {visit.physiotherapyDoctorData?.therapySessions?.length > 0 ? (
                                visit.physiotherapyDoctorData.therapySessions.map((session, si) =>
                                  session.therapyData?.map((therapy, ti) => (
                                    <div key={`${si}-${ti}`} className="p-3 border rounded-3 bg-white shadow-sm">
                                      <div className="fw-semibold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{therapy.therapyName}</div>
                                      <div className="small text-secondary">
                                        {therapy.exercises?.length || 0} exercise(s) — ₹{therapy.totalTherapyPrice?.toFixed(0) || 0}
                                      </div>
                                    </div>
                                  ))
                                )
                              ) : (
                                <div className="p-3 bg-light rounded-3 text-center text-secondary small fst-italic">
                                  No sessions prescribed yet.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons — only for Visit 1 */}
                          {visit.visitNumber?.toLowerCase() === 'visit 1' && (
                            <div className="visit-action-buttons mt-auto">
                              <CButton
                                className="btn-premium visit-action-btn"
                                onClick={() => navigate(`/bookings/${id}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&therapistId=${visit.physiotherapyDoctorData?.treatmentPlan?.therapistId || ''}`)}
                              >
                                <Activity size={18} /> View Sessions
                              </CButton>
                              <CButton
                                className="btn-premium visit-action-btn"
                                style={{ background: 'var(--primary-gradient)' }}
                                onClick={() => navigate(`/bookings/${id}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}&doctorId=${visit.physiotherapyDoctorData?.doctorId || ''}`, { state: { visit } })}
                              >
                                <Home size={18} /> Home Exercises
                              </CButton>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CAccordionBody>
                </CAccordionItem>
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
            <div className="text-center py-5">
              <ClipboardList size={64} className="text-secondary opacity-25 mb-3" />
              <h4>No visit history found</h4>
            </div>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default VisitHistory;
