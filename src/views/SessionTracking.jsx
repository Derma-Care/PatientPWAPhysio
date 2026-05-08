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
  X
} from 'lucide-react';
import { physiotherapyService } from '../services/api';

const ExerciseCard = React.memo(({ item, onClick }) => {
  const sessions = item.sessions || [];
  const completedSessions = sessions.filter(s => s.status === 'Completed').length;
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
          {type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
          {type === 'video' ? 'Video Update' : 'Media Preview'}
        </CModalTitle>
        <CButton variant="ghost" onClick={onClose}><X size={24} /></CButton>
      </CModalHeader>
      <CModalBody className="p-0 bg-black rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        {type === 'video' ? (
          <video
            src={mediaUrl}
            controls
            className="w-100 h-100"
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

const SessionModal = ({ exercise, visible, onClose }) => {
  const [previewData, setPreviewData] = useState({ visible: false, url: '', type: '' });

  if (!exercise) return null;

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
        <CButton variant="ghost" onClick={onClose} className="p-1"><X size={24} /></CButton>
      </CModalHeader>
      <CModalBody className="p-4">
        <p className="text-secondary small mb-4">Complete activity history for this exercise</p>

        <div className="session-timeline">
          {exercise.sessions?.map((session, sIdx) => (
            <div key={`${exercise.exerciseId}-${session.sessionNo}`} className="timeline-item">
              <div className={`timeline-dot ${session.status === 'Completed' ? 'bg-success' : 'bg-warning'}`} />

              <div className="bg-light bg-opacity-50 rounded-4 p-4 border border-white mb-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-white text-dark border px-3 py-2 fw-bold">
                      Session {session.sessionNo}
                    </span>
                    <span className="small text-secondary fw-semibold d-flex align-items-center gap-1">
                      <Calendar size={14} /> {session.date}
                    </span>
                  </div>
                  <div className={`status-chip ${session.status === 'Completed' ? 'status-completed' : 'status-pending'}`}>
                    {session.status === 'Completed' ? (
                      <><CheckCircle2 size={12} className="me-1" /> Completed</>
                    ) : (
                      <><Clock size={12} className="me-1" /> Pending</>
                    )}
                  </div>
                </div>

                {session.therapistRecord ? (
                  <div className="therapist-record">
                    <CRow className="g-4">
                      <CCol md={6}>
                        <div>
                          <label className="text-secondary small fw-bold text-uppercase ls-1 d-block mb-2">Performance & Pain</label>
                          <div className="pain-scale-container flex-column align-items-start gap-3">
                            <div className="w-100 d-flex justify-content-between align-items-center">
                              <div>
                                <span className="small text-secondary d-block">Pain Scale (Before → After)</span>
                                <div className="d-flex align-items-center gap-3 mt-2">
                                  <div className={`pain-indicator ${getPainClass(session.therapistRecord.painBefore)}`}>
                                    {session.therapistRecord.painBefore}
                                  </div>
                                  <ChevronRight size={16} className="text-secondary" />
                                  <div className={`pain-indicator ${getPainClass(session.therapistRecord.painAfter)}`}>
                                    {session.therapistRecord.painAfter}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-100 border-top pt-3 mt-1">
                              <span className="small text-secondary d-block">Sets & Repetitions Done</span>
                              <div className="mt-1 d-flex gap-4">
                                <div>
                                  <span className="text-dark fw-bold fs-5">{session.therapistRecord.setsDone || 0}</span>
                                  <span className="text-secondary small ms-1">Sets</span>
                                </div>
                                <div>
                                  <span className="text-dark fw-bold fs-5">{session.therapistRecord.repetationDone || 0}</span>
                                  <span className="text-secondary small ms-1">Reps</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CCol>
                      <CCol md={6}>
                        <div className="mb-4">
                          <label className="text-secondary small fw-bold text-uppercase ls-1 d-block mb-2">Observations</label>
                          <div className="bg-white p-3 rounded-3 border h-100">
                            <div className="d-flex gap-2 mb-2">
                              <FileText size={16} className="text-primary" />
                              <span className="fw-semibold text-dark italic small">"{session.therapistRecord.therapistNotes || 'No notes provided'}"</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <CheckCircle2 size={14} className="text-success" />
                              <span className="small text-success fw-bold">{session.therapistRecord.patientResponse || 'Standard Response'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-3">
                          {(() => {
                            const ensureBase64Prefix = (str, type) => {
                              if (!str || str === "null") return null;
                              if (str.startsWith('data:')) return str;
                              return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
                            };

                            const record = session.therapistRecord;
                            const mediaItems = [
                              { key: 'beforeImage', label: 'Before Image', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                              { key: 'afterImage', label: 'After Image', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                              { key: 'beforeVideo', label: 'Before Video', type: 'video', icon: Video, color: '#06b6d4' },
                              { key: 'afterVideo', label: 'After Video', type: 'video', icon: Video, color: '#06b6d4' }
                            ];

                            return mediaItems.map(item => {
                              const data = record[item.key];
                              if (!data || data === "null") return null;
                              const fullUrl = ensureBase64Prefix(data, item.type);
                              return (
                                <CButton 
                                  key={item.key}
                                  className="p-0 border-0 d-flex align-items-center gap-2 small fw-bold text-decoration-none hover-scale transition-all"
                                  onClick={() => handleMediaClick(fullUrl, item.type)}
                                >
                                  <div className="p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: item.color, width: '34px', height: '34px' }}>
                                    <item.icon size={18} className="text-white" />
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
                ) : (
                  <div className="text-center py-4 bg-white rounded-4 border border-dashed">
                    <AlertCircle size={24} className="text-secondary opacity-25 mb-2" />
                    <p className="text-secondary small m-0">Activity log pending for this session</p>
                  </div>
                )}
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
    };
  }, [location.search]);

  const { patientId, therapistRecordId, clinicId, branchId } = queryParams;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchSessions = async () => {
      try {
        if (patientId && therapistRecordId) {
          setLoading(true);
          const response = await physiotherapyService.getActivitySessions(
            clinicId, branchId, id, patientId, therapistRecordId
          );

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
      />
    </motion.div>
  );
};

export default SessionTracking;


