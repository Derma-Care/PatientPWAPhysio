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
  X
} from 'lucide-react';
import { physiotherapyService, customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CModal, CModalHeader, CModalTitle, CModalBody } from '@coreui/react';

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
          {isYouTube ? <PlayCircle size={20} className="text-danger" /> : (type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />)}
          {isYouTube ? 'Exercise Tutorial' : (type === 'video' ? 'Video Update' : 'Media Preview')}
        </CModalTitle>
        <CButton variant="ghost" onClick={onClose} className="p-0"><X size={28} /></CButton>
      </CModalHeader>
      <CModalBody className="p-0 bg-black rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center mt-3" style={{ minHeight: '350px' }}>
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

  useEffect(() => {
    const abortController = new AbortController();

    const fetchHistory = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        let patientId = urlParams.get('patientId');

        setLoading(true);

        // Fallback: If patientId is missing from URL, try to find it from user's bookings
        if (!patientId && user?.customerId) {
          const bookingsRes = await customerService.getBookings(user.customerId);
          const currentBooking = bookingsRes.data?.find(b => b.bookingId === id);
          if (currentBooking) {
            patientId = currentBooking.patientId;
          }
        }

        if (!patientId || !id) {
          setHistory([]);
          return;
        }

        const response = await physiotherapyService.getVisitHistory(patientId, id);
        if (!abortController.signal.aborted) {
          setHistory(response.data || []);
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
        <CSpinner color="primary" variant="grow" />
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
              <CAccordion flush className="rounded-4 overflow-hidden border shadow-sm bg-white">
                {history.map((visit, idx) => (
                  <CAccordionItem itemKey={idx} key={idx} className="border-bottom">
                  <CAccordionHeader className="p-2">
                    <div className="w-100 d-flex justify-content-between align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '45px', height: '45px' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-5">{visit.visitNumber}</div>
                          <div className="small text-secondary fw-semibold">
                            {visit.visitDate} • {visit.visitTime}
                          </div>
                        </div>
                      </div>
                      {/* <CBadge color="primary" shape="pill" className="px-3 py-2 bg-opacity-10 text-white fw-bold">
                        Completed
                      </CBadge> */}
                    </div>
                  </CAccordionHeader>
                  <CAccordionBody className="p-4 bg-light bg-opacity-25">
                    <CRow className="g-4">
                      {/* Section 1: Complaints & Investigation */}
                      <CCol md={6}>
                        <div className="premium-card p-3 bg-white mb-4">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Activity size={18} className="text-danger" /> Complaints & Investigation
                          </h6>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Details:</span>
                            <span className="fw-semibold text-dark">{visit.physiotherapyDoctorData?.complaints?.complaintDetails || 'None'}</span>
                          </div>
                          <div className="small">
                            <span className="text-secondary d-block">Tests Performed:</span>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                              {visit.physiotherapyDoctorData?.investigation?.tests?.map((test, i) => (
                                <CBadge key={i} color="info" variant="outline" shape="pill" className="fw-bold px-3">{test}</CBadge>
                              )) || <span className="text-secondary">None</span>}
                            </div>
                          </div>
                        </div>

                        {/* Follow-up Section (Flow Update) - Now on the left side */}
                        {visit.physiotherapyDoctorData?.followUp?.nextVisitDate && (
                          <div className="mt-3 p-3 rounded-4 bg-primary bg-opacity-10 border border-white border-opacity-10">
                            <h6 className="fw-bold text-white mb-2 d-flex align-items-center gap-2">
                              <Calendar size={16} /> Next Follow-up
                            </h6>
                            <div className="fw-bold text-white small">{visit.physiotherapyDoctorData.followUp.nextVisitDate}</div>
                            {visit.physiotherapyDoctorData.followUp.reviewNotes && (
                              <div className="small text-white mt-1">{visit.physiotherapyDoctorData.followUp.reviewNotes}</div>
                            )}
                          </div>
                        )}

                        {/* Prescription File - Now on the left side */}
                        {visit.prescriptionPdf && (
                          <CButton
                            className="btn-premium w-100 mt-3 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            style={{ background: '#f43f5e', border: 'none' }}
                            onClick={() => {
                              const base64Data = visit.prescriptionPdf;
                              try {
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: 'application/pdf' });
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (error) {
                                console.error('Error opening PDF:', error);
                              }
                            }}
                          >
                            <FileText size={18} /> View Prescription PDF
                          </CButton>
                        )}
                      </CCol>

                      {/* Section 2: Diagnosis & Treatment */}
                      <CCol md={6}>
                        <div className="premium-card p-3 bg-white mb-4">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Stethoscope size={18} className="text-success" /> Physio Diagnosis
                          </h6>
                          <div className="mb-3">
                            <div className="fw-bold text-dark fs-5 mb-1">{visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis}</div>
                            <div className="d-flex gap-2">
                              <CBadge color="warning" className="px-2 py-1 text-dark">Severity: {visit.physiotherapyDoctorData?.diagnosis?.severity}</CBadge>
                              <CBadge color="info" className="px-2 py-1">Stage: {visit.physiotherapyDoctorData?.diagnosis?.stage}</CBadge>
                            </div>
                          </div>
                          <div className="small text-secondary">
                            Affected Area: <span className="text-dark fw-semibold">{visit.physiotherapyDoctorData?.diagnosis?.affectedArea}</span>
                          </div>
                        </div>

                        <div className="premium-card p-3 bg-white">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Target size={18} className="text-warning" /> Treatment Plan
                          </h6>
                          <div className="small mb-2">
                            <span className="text-secondary">Therapist:</span>
                            <span className="ms-2 fw-bold text-dark">{visit.physiotherapyDoctorData?.treatmentPlan?.therapistName}</span>
                          </div>
                          <div className="small mb-4">
                            <span className="text-secondary">Programs:</span>
                            <div className="mt-2 d-flex flex-column gap-2">
                              {visit.physiotherapyDoctorData?.therapySessions?.[0]?.programs?.map((prog, i) => (
                                <div key={i} className="p-2 border rounded-3 bg-light small fw-semibold d-flex justify-content-between align-items-center">
                                  {prog.programName}
                                  {prog.videoUrl && (
                                    <CButton 
                                      color="danger" 
                                      size="sm" 
                                      variant="ghost" 
                                      className="p-0 border-0"
                                      onClick={() => setPreviewData({ visible: true, url: prog.videoUrl, type: 'youtube' })}
                                    >
                                      <PlayCircle size={16} />
                                    </CButton>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>


                          <div className="d-flex flex-wrap gap-2 mt-4">
                            <CButton
                              className="btn-premium flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                              onClick={() => navigate(`/bookings/${id}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}`)}
                            >
                              <Activity size={18} /> Sessions
                            </CButton>
                            <CButton
                              className="btn-premium flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                              style={{ background: 'var(--primary-gradient)' }}
                              onClick={() => navigate(`/bookings/${id}/home-exercises?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}`)}
                            >
                              <Home size={18} /> Home Exercises
                            </CButton>
                          </div>
                        </div>
                      </CCol>
                    </CRow>
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
