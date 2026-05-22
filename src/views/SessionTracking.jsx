import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CSpinner,
  CButton,
  CContainer,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  X,
  Mic
} from 'lucide-react';
import { physiotherapyService } from '../services/api';

const ExerciseCard = React.memo(({ item, onClick }) => {
  const sessions = item.sessions || [];
  const completedSessions = sessions.filter(s => String(s.status).toLowerCase() === 'completed').length;
  const totalSessions = sessions.length;
  const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <motion.div
      className="h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="premium-card h-100 border-0 p-4 cursor-pointer d-flex flex-column shadow-sm"
        onClick={() => onClick(item)}
        style={{ cursor: 'pointer' }}
      >
        <div className="bg-primary p-3 rounded-4 text-white d-inline-flex align-self-start mb-3 shadow-sm">
          <Activity size={24} />
        </div>

        <h5 className="fw-bold text-dark mb-2 text-truncate w-100" title={item.exerciseName}>
          {item.exerciseName}
        </h5>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small text-secondary fw-semibold">
              {completedSessions} / {totalSessions} Sessions
            </span>
            <span className="small text-primary fw-bold">{Math.round(progress)}%</span>
          </div>
          <div className="exercise-progress" style={{ marginTop: 0 }}>
            <motion.div
              className="exercise-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>

          <div className="mt-3 d-flex align-items-center text-primary small fw-bold">
            View Sessions <ChevronRight size={14} className="ms-1 text-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" className="premium-modal">
      <CModalHeader className="border-0">
        <CModalTitle className="fw-bold d-flex align-items-center gap-2">
          {type === 'video' ? <Video size={20} /> : (type === 'audio' ? <Mic size={20} /> : <ImageIcon size={20} />)}
          {type === 'video' ? 'Video Update' : (type === 'audio' ? 'Voice Record' : 'Media Preview')}
        </CModalTitle>
        {/* <CButton variant="ghost" onClick={onClose}><X size={24} /></CButton> */}
      </CModalHeader>
      <CModalBody className="p-0 bg-black rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center" style={{ minHeight: type === 'audio' ? '150px' : '300px' }}>
        {type === 'video' ? (
          <video
            src={mediaUrl}
            controls
            className="w-100 h-100"
            style={{ maxHeight: '70vh' }}
            autoPlay
          />
        ) : type === 'audio' ? (
          <div className="w-100 p-4 bg-dark d-flex align-items-center justify-content-center">
            <audio src={mediaUrl} controls className="w-100" autoPlay />
          </div>
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

const SessionModal = ({ exercise, visible, onClose, clinicId, branchId, therapistRecordId }) => {
  const [previewData, setPreviewData] = useState({ visible: false, url: '', type: '' });
  const [loadingSessionId, setLoadingSessionId] = useState(null);
  const [fetchedRecords, setFetchedRecords] = useState({});

  if (!exercise) return null;

  const handleViewData = async (sessionId) => {
    setLoadingSessionId(sessionId);
    try {
      const response = await physiotherapyService.getCompletedTherapyRecord(clinicId, branchId, therapistRecordId, sessionId);
      const data = response?.data?.therapistRecord || response?.data || response?.therapistRecord || response;
      if (data) {
        setFetchedRecords(prev => ({ ...prev, [sessionId]: data }));
      }
    } catch (error) {
      console.error("Error fetching completed therapy record", error);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleMediaClick = (url, type) => {
    setPreviewData({ visible: true, url, type });
  };

  const getPainClass = (value) => {
    const pain = parseInt(value);
    if (pain <= 3) return 'low';
    if (pain <= 7) return 'medium';
    return 'high';
  };

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      backdrop="static"
      className="premium-modal"
      scrollable
    >
      <CModalHeader className="border-0 pb-0">
        <CModalTitle className="fw-bold text-dark d-flex align-items-center gap-3">
          <div className="bg-primary p-2 rounded-3 text-white shadow-sm">
            <Activity size={20} />
          </div>
          {exercise.exerciseName}
        </CModalTitle>
        {/* <CButton variant="ghost" onClick={onClose} className="p-1"><X size={24} /></CButton> */}
      </CModalHeader>
      <CModalBody className="p-4">
        <p className="text-secondary small mb-4">Complete activity history for this exercise</p>

        <div className="session-timeline">
          {exercise.sessions?.map((session, sIdx) => (
            <div key={`${exercise.exerciseId}-${session.sessionNo}`} className="timeline-item">
              <div className={`timeline-dot ${String(session.status).toLowerCase() === 'completed' ? 'bg-success' : 'bg-warning'}`} />

              <div className="bg-light bg-opacity-50 rounded-4 p-4 border border-white mb-3">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="badge bg-white text-dark border px-2 py-1 fw-semibold">
                      Session {session.sessionNo}
                    </span>
                    <span className="small text-secondary fw-semibold d-flex align-items-center gap-1">
                      <Calendar size={14} /> {session.date}
                    </span>
                  </div>
                  <div className={`status-chip ${String(session.status).toLowerCase() === 'completed' ? 'status-completed' : 'status-pending'}`}>
                    {String(session.status).toLowerCase() === 'completed' ? (
                      <><CheckCircle2 size={12} className="me-1" /> Completed</>
                    ) : (
                      <><Clock size={12} className="me-1" /> Pending</>
                    )}
                  </div>
                </div>

                {(() => {
                  const record = session.therapistRecord || fetchedRecords[session.sessionId];
                  if (record) {
                    return (
                      <div className="therapist-record">
                        {/* New Date and Status alignment header */}
                        <div className="row g-3 mb-4 border-bottom pb-3">
                          <div className="col-12 col-md-4 d-flex flex-column">
                            <span className="text-secondary fw-semibold text-uppercase ls-1 mb-1" style={{ fontSize: '0.65rem' }}>Completed On</span>
                            <span className="text-dark fw-semibold" style={{ fontSize: '0.9rem' }}>{record.completedDate || session.date} {record.completedTime ? `at ${record.completedTime}` : ''}</span>
                          </div>
                          <div className="col-6 col-md-4 d-flex flex-column">
                            <span className="text-secondary fw-semibold text-uppercase ls-1 mb-1" style={{ fontSize: '0.65rem' }}>Duration</span>
                            <span className="text-dark fw-semibold" style={{ fontSize: '0.9rem' }}>{record.duration || 'N/A'}</span>
                          </div>
                          <div className="col-6 col-md-4 d-flex flex-column">
                            <span className="text-secondary fw-semibold text-uppercase ls-1 mb-1" style={{ fontSize: '0.65rem' }}>Result</span>
                            <div>
                              <span className="badge bg-success bg-opacity-10 text-success border px-3 py-1 mt-1">{record.result || 'Completed'}</span>
                            </div>
                          </div>
                        </div>

                        <CRow className="g-4">
                          <CCol md={6}>
                            <div>
                              <label className="text-secondary fw-semibold text-uppercase ls-1 d-block mb-2" style={{ fontSize: '0.75rem' }}>Performance & Pain</label>
                              <div className="pain-scale-container flex-column align-items-start gap-3">
                                <div className="w-100 d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="small text-secondary fw-medium d-block mb-2">Pain Scale (Before → After)</span>
                                    <div className="d-flex align-items-center gap-3">
                                      <div
                                        className={`pain-indicator ${getPainClass(record.painBefore)} text-dark d-flex align-items-center justify-content-center rounded-3 shadow-sm`}
                                        style={{ width: '40px', height: '40px', fontSize: '1.1rem', fontWeight: '600' }}
                                      >
                                        {record.painBefore || '-'}
                                      </div>
                                      <ChevronRight size={18} className="text-secondary" />
                                      <div
                                        className={`pain-indicator ${getPainClass(record.painAfter)} text-dark d-flex align-items-center justify-content-center rounded-3 shadow-sm`}
                                        style={{ width: '40px', height: '40px', fontSize: '1.1rem', fontWeight: '600' }}
                                      >
                                        {record.painAfter || '-'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-100 border-top pt-3 mt-1">
                                  <span className="small text-secondary fw-medium d-block mb-1">Sets & Repetitions Done</span>
                                  <div className="d-flex gap-4">
                                    <div>
                                      <span className="text-dark fw-bold" style={{ fontSize: '1.1rem' }}>{record.setsDone || 0}</span>
                                      <span className="text-secondary small ms-1">Sets</span>
                                    </div>
                                    <div>
                                      <span className="text-dark fw-bold" style={{ fontSize: '1.1rem' }}>{record.repetationDone || 0}</span>
                                      <span className="text-secondary small ms-1">Reps</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CCol>
                          <CCol md={6}>
                            <div className="mb-4">
                              <label className="text-secondary fw-semibold text-uppercase ls-1 d-block mb-2" style={{ fontSize: '0.75rem' }}>Observations & Plan</label>
                              <div className="bg-white p-3 rounded-3 border mb-3">
                                <div className="d-flex flex-column gap-3">
                                  <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <FileText size={14} className="text-primary" />
                                      <span className="small fw-semibold text-dark">Therapist Notes</span>
                                    </div>
                                    <span className="fw-medium text-secondary italic small d-block ms-4">"{record.therapistNotes || 'No notes provided'}"</span>
                                  </div>

                                  <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <Activity size={14} className="text-info" />
                                      <span className="small fw-semibold text-dark">Patient Response</span>
                                    </div>
                                    <span className="fw-medium text-secondary small d-block ms-4">{record.patientResponse || 'Standard Response'}</span>
                                  </div>

                                  {record.nextPlan && (
                                    <div className="border-top pt-2 mt-1">
                                      <div className="d-flex align-items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-warning" />
                                        <span className="small fw-semibold text-dark">Next Plan</span>
                                      </div>
                                      <span className="fw-medium text-secondary small d-block ms-4">{record.nextPlan}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex flex-wrap gap-3">
                              {(() => {
                                const ensureBase64Prefix = (str, type) => {
                                  if (!str || str === "null") return null;
                                  if (str.startsWith('http')) return str;
                                  if (str.startsWith('data:')) return str;
                                  const mimeType = type === 'video' ? 'video/mp4' : (type === 'audio' ? 'audio/webm' : 'image/jpeg');
                                  return `data:${mimeType};base64,${str}`;
                                };

                                const mediaItems = [
                                  { key: 'beforeImage', label: 'Before Image', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                                  { key: 'afterImage', label: 'After Image', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                                  { key: 'beforeVideo', label: 'Before Video', type: 'video', icon: Video, color: '#06b6d4' },
                                  { key: 'afterVideo', label: 'After Video', type: 'video', icon: Video, color: '#06b6d4' },
                                  { key: 'voiceRecord', label: 'Voice Record', type: 'audio', icon: Mic, color: '#8b5cf6' }
                                ];

                                return mediaItems.map(item => {
                                  const data = record[item.key];
                                  if (!data || data === "null") return null;
                                  const fullUrl = ensureBase64Prefix(data, item.type);
                                  return (
                                    <CButton
                                      key={item.key}
                                      className="p-2 border rounded-3 d-flex align-items-center gap-2 small fw-bold text-decoration-none hover-scale transition-all bg-light"
                                      onClick={() => handleMediaClick(fullUrl, item.type)}
                                      style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '130px' }}
                                    >
                                      <div className="p-2 rounded-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: item.color, width: '32px', height: '32px' }}>
                                        <item.icon size={16} className="text-white" />
                                      </div>
                                      <span className="text-dark opacity-75">{item.label}</span>
                                    </CButton>
                                  );
                                });
                              })()}
                            </div>
                          </CCol>
                        </CRow>
                      </div>
                    );
                  }

                  const currentStatus = String(session.status).toLowerCase();
                  if (currentStatus === 'completed' || currentStatus === 'active') {
                    return (
                      <div className="text-center py-4 bg-white rounded-4 border border-dashed">
                        <CButton
                          color="primary"
                          variant="outline"
                          onClick={() => handleViewData(session.sessionId)}
                          disabled={loadingSessionId === session.sessionId}
                          className="d-flex align-items-center justify-content-center gap-2 mx-auto"
                        >
                          {loadingSessionId === session.sessionId ? (
                            <><CSpinner size="sm" /> Loading...</>
                          ) : (
                            <><Activity size={16} /> View Data</>
                          )}
                        </CButton>
                      </div>
                    );
                  }

                  return (
                    <div className="text-center py-4 bg-white rounded-4 border border-dashed">
                      <AlertCircle size={24} className="text-secondary opacity-25 mb-2" />
                      <p className="text-secondary small m-0 p-2">Activity log pending for this session</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </CModalBody>
      <CModalFooter className="border-0">
        <CButton color="secondary" variant="ghost" onClick={onClose}>Close</CButton>
      </CModalFooter>

      <MediaPreviewModal
        visible={previewData.visible}
        onClose={() => setPreviewData({ ...previewData, visible: false })}
        mediaUrl={previewData.url}
        type={previewData.type}
      />
    </CModal>
  );
};

const SessionTracking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const queryParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      patientId: query.get('patientId'),
      therapistRecordId: query.get('therapistRecordId'),
      clinicId: query.get('clinicId'),
      branchId: query.get('branchId'),
      therapistId: query.get('therapistId') || '',
    };
  }, [location.search]);

  const { patientId, therapistRecordId, clinicId, branchId, therapistId } = queryParams;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchSessions = async () => {
      try {
        if (patientId && therapistRecordId) {
          setLoading(true);
          const response = await physiotherapyService.getActivitySessions({
            clinicId,
            branchId,
            patientId,
            bookingId: id,
            therapistId,
            therapistRecordId
          });

          if (!abortController.signal.aborted) {
            let data = Array.isArray(response?.data) ? response.data : [];
            setSessions(data);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching sessions:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();
    return () => abortController.abort();
  }, [id, patientId, therapistRecordId, clinicId, branchId]);

  const handleCardClick = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <CContainer className="py-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Activity size={48} className="text-primary opacity-50 mb-3" />
          </motion.div>
          <h5 className="text-secondary opacity-75 fw-semibold">Synchronizing Activity Data...</h5>
        </div>
      </CContainer>
    );
  }

  return (
    <motion.div
      className="p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="activity-header">
        <CButton
          variant="ghost"
          className="p-0 text-decoration-none text-secondary mb-4 d-flex align-items-center gap-2 hover-primary"
          onClick={() => navigate(`/bookings/${id}/history`)}
        >
          <ArrowLeft size={18} /> Back to History
        </CButton>
        <div className="d-flex align-items-end justify-content-between">
          <div>
            <h2 className="fw-bold text-dark m-0 display-6">Activity Sessions</h2>
            <p className="text-secondary fw-medium mt-1">
              <span className="badge bg-primary bg-opacity-10 text-white me-2 px-3">Tracking</span>
              Click on an exercise card to view detailed session logs
            </p>
          </div>
        </div>
      </div>

      <CRow className="g-4">
        {sessions.length > 0 ? (
          sessions.map((item, index) => (
            <CCol key={item.exerciseId} xs={12} sm={6} lg={4} xl={3}>
              <ExerciseCard
                item={item}
                onClick={handleCardClick}
              />
            </CCol>
          ))
        ) : (
          <CCol xs={12}>
            <div className="text-center py-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Activity size={80} className="text-secondary opacity-10 mb-4" />
                <h3 className="text-secondary">No Activity Sessions Found</h3>
                <p className="text-muted">Your activity logs will appear here once sessions are scheduled.</p>
              </motion.div>
            </div>
          </CCol>
        )}
      </CRow>

      <SessionModal
        exercise={selectedExercise}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        clinicId={clinicId}
        branchId={branchId}
        therapistRecordId={therapistRecordId}
      />
    </motion.div>
  );
};

export default SessionTracking;


