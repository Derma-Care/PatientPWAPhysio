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

/* ── Exercise Card ───────────────────────────────────────────── */
const ExerciseCard = React.memo(({ item, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const sessions = item.sessions || [];
  const completedSessions = sessions.filter(s => String(s.status).toLowerCase() === 'completed').length;
  const totalSessions = sessions.length;
  const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <motion.div
      className="h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="app-booking-item h-100 d-flex flex-column"
        onClick={() => onClick(item)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? 'var(--s-lg)' : 'var(--s-sm)',
          borderColor: hovered ? 'var(--c-navy-light)' : 'var(--c-border)',
          transition: 'all 0.2s',
          padding: '16px',
        }}
      >
        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
            <Activity size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{

              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--c-text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }} title={item.exerciseName}>
              {item.exerciseName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--c-text-3)', fontWeight: 600, marginTop: '2px' }}>
              {completedSessions} / {totalSessions} Sessions
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Progress</span>
            <span style={{ fontSize: '11px', color: 'var(--c-navy)', fontWeight: 800 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--c-surface-3)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{
                height: '100%',
                background: progress === 100 ? 'var(--c-success)' : 'var(--g-navy-soft)',
                borderRadius: 'var(--r-pill)',
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto' }}>
          <button className="app-link-btn" style={{ fontSize: '12px' }}>
            View Sessions
            <ChevronRight
              size={14}
              style={{ transition: 'transform 0.2s', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

/* ── Media Preview Modal ─────────────────────────────────────── */
const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center">
      <CModalHeader style={{ border: 'none', padding: '18px 20px 10px', fontFamily: 'var(--font-display)' }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '16px', color: 'var(--c-text)' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '34px', height: '34px', borderRadius: '9px' }}>
            {type === 'video' ? <Video size={16} /> : type === 'audio' ? <Mic size={16} /> : <ImageIcon size={16} />}
          </div>
          {type === 'video' ? 'Video Update' : type === 'audio' ? 'Voice Record' : 'Media Preview'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ padding: 0, background: '#0f172a', borderRadius: '0 0 16px 16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: type === 'audio' ? '150px' : '300px' }}>
        {type === 'video' ? (
          <video src={mediaUrl} controls className="w-100 h-100" style={{ maxHeight: '70vh' }} autoPlay />
        ) : type === 'audio' ? (
          <div style={{ width: '100%', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <audio src={mediaUrl} controls className="w-100" autoPlay />
          </div>
        ) : (
          <img src={mediaUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
        )}
      </CModalBody>
    </CModal>
  );
};

/* ── Session Modal ───────────────────────────────────────────── */
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
      if (data) setFetchedRecords(prev => ({ ...prev, [sessionId]: data }));
    } catch (error) {
      console.error("Error fetching completed therapy record", error);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleMediaClick = (url, type) => setPreviewData({ visible: true, url, type });

  const getPainClass = (value) => {
    const pain = parseInt(value);
    if (pain <= 3) return 'low';
    if (pain <= 7) return 'medium';
    return 'high';
  };

  const getPainColor = (value) => {
    const pain = parseInt(value);
    if (pain <= 3) return { bg: 'var(--c-success-light)', text: 'var(--c-success)' };
    if (pain <= 7) return { bg: 'var(--c-warning-light)', text: 'var(--c-warning)' };
    return { bg: 'var(--c-danger-light)', text: 'var(--c-danger)' };
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg" backdrop="static" scrollable>
      {/* Header */}
      <CModalHeader style={{ border: 'none', padding: '20px 24px 12px', background: 'var(--c-surface)' }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '17px', color: 'var(--c-text)' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '40px', height: '40px', borderRadius: '11px' }}>
            <Activity size={20} />
          </div>
          {exercise.exerciseName}
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '4px 24px 20px', background: 'var(--c-surface-2)' }}>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '20px', fontWeight: 500 }}>
          Complete activity history for this exercise
        </p>

        <div className="session-timeline">
          {exercise.sessions?.map((session, sIdx) => {
            const isCompleted = String(session.status).toLowerCase() === 'completed';
            const record = session.therapistRecord || fetchedRecords[session.sessionId];
            const currentStatus = String(session.status).toLowerCase();

            return (
              <div key={`${exercise.exerciseId}-${session.sessionNo}`} className="timeline-item">
                <div className={`timeline-dot ${isCompleted ? 'bg-success' : 'bg-warning'}`} />

                <div className="app-card" style={{ marginBottom: '12px' }}>
                  {/* Session Header */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                    alignItems: 'center', gap: '10px',
                    padding: '14px 16px 12px',
                    borderBottom: '1px solid var(--c-border-light)',
                    background: 'var(--c-surface)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'var(--g-navy-soft)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800,
                      }}>
                        {session.sessionNo}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
                        Session {session.sessionNo}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-text-3)', fontWeight: 600 }}>
                        <Calendar size={12} color="var(--c-navy)" /> {session.date}
                      </span>
                    </div>

                    {/* Status pill */}
                    <span className={`app-status-pill ${isCompleted ? 'app-status-confirmed' : 'app-status-pending'}`}
                      style={{ fontSize: '10px', padding: '4px 12px' }}>
                      <span className="app-status-dot" />
                      {isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  {/* Session Body */}
                  <div style={{ padding: '14px 16px' }}>
                    {record ? (
                      <div>
                        {/* Meta row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth < 768
                              ? '1fr'
                              : 'repeat(3, 1fr)',
                            gap: '10px',
                            background: 'var(--c-surface-2)',
                            borderRadius: 'var(--r-sm)',
                            padding: '12px 14px',
                            marginBottom: '14px',
                            border: '1px solid var(--c-border-light)',
                          }}
                        >
                          {[
                            {
                              label: 'Completed On',
                              value: `${record.completedDate || session.date} · ${record.completedTime
                                ? new Date(`1970-01-01T${record.completedTime}`)
                                  .toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''
                                }`,
                            },
                            {
                              label: 'Duration',
                              value: record.duration || 'N/A',
                            },
                            // {
                            //   label: 'Result',
                            //   value: record.result || 'Completed',
                            //   badge: true,
                            // },
                          ].map((m, i) => (
                            <div key={i}>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--c-text-3)',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  marginBottom: '4px',
                                }}
                              >
                                {m.label}
                              </div>

                              {m.badge ? (
                                <span
                                  style={{
                                    background: 'var(--c-success-light)',
                                    color: 'var(--c-success)',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: 'var(--r-pill)',
                                    display: 'inline-block',
                                  }}
                                >
                                  {m.value}
                                </span>
                              ) : (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--c-text)',
                                  }}
                                >
                                  {m.value}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <CRow className="g-3">
                          {/* Pain & Performance */}
                          <CCol md={6}>
                            <div style={{ background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border-light)', padding: '12px 14px', height: '100%' }}>
                              <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
                                Performance & Pain
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--c-text-2)', fontWeight: 600, marginBottom: '8px' }}>Pain Scale (Before → After)</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {[record.painBefore, record.painAfter].map((val, i) => {
                                    const pc = getPainColor(val);
                                    return (
                                      <React.Fragment key={i}>
                                        <div style={{
                                          width: '38px', height: '38px', borderRadius: '10px',
                                          background: pc.bg, color: pc.text,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '15px', fontWeight: 800,
                                          border: `1.5px solid ${pc.text}33`,
                                        }}>
                                          {val || '-'}
                                        </div>
                                        {i === 0 && <ChevronRight size={14} color="var(--c-text-3)" />}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '10px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--c-text-2)', fontWeight: 600, marginBottom: '8px' }}>Sets & Repetitions</div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                  {[{ v: record.setsDone || 0, l: 'Sets' }, { v: record.repetationDone || 0, l: 'Reps' }].map((s, i) => (
                                    <div key={i}>
                                      <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--c-navy)' }}>{s.v}</span>
                                      <span style={{ fontSize: '11px', color: 'var(--c-text-3)', fontWeight: 600, marginLeft: '4px' }}>{s.l}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CCol>

                          {/* Notes */}
                          <CCol md={6}>
                            <div style={{ background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border-light)', padding: '12px 14px', marginBottom: '10px' }}>
                              <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>
                                Observations & Plan
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                  { icon: <FileText size={13} color="var(--c-navy)" />, label: 'Therapist Notes', val: record.therapistNotes || 'No notes provided', italic: true },
                                  { icon: <Activity size={13} color="var(--c-info)" />, label: 'Patient Response', val: record.patientResponse || 'Standard Response' },
                                  ...(record.nextPlan ? [{ icon: <Calendar size={13} color="var(--c-warning)" />, label: 'Next Plan', val: record.nextPlan }] : []),
                                ].map((n, i) => (
                                  <div key={i} style={i > 0 ? { borderTop: '1px solid var(--c-border-light)', paddingTop: '8px' } : {}}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                      {n.icon}
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text)' }}>{n.label}</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--c-text-2)', margin: 0, paddingLeft: '19px', fontStyle: n.italic ? 'italic' : 'normal' }}>
                                      {n.italic ? `"${n.val}"` : n.val}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Media buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {(() => {
                                const ensureBase64Prefix = (str, type) => {
                                  if (!str || str === "null") return null;
                                  if (str.startsWith('http') || str.startsWith('data:')) return str;
                                  const mimeType = type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/webm' : 'image/jpeg';
                                  return `data:${mimeType};base64,${str}`;
                                };
                                const mediaItems = [
                                  { key: 'beforeImage', label: 'Before', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
                                  { key: 'afterImage', label: 'After', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
                                  { key: 'beforeVideo', label: 'Before', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
                                  { key: 'afterVideo', label: 'After', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
                                  { key: 'voiceRecord', label: 'Voice', type: 'audio', icon: Mic, colorClass: 'app-icon-purple' },
                                  { key: 'consentPdfUrl', label: 'Consent Form', type: 'file', icon: FileText, colorClass: 'app-icon-purple' },
                                ];
                                return mediaItems.map(item => {
                                  const data = record[item.key];
                                  if (!data || data === "null") return null;
                                  const fullUrl = ensureBase64Prefix(data, item.type);
                                  return (
                                    <button
                                      key={item.key}
                                      onClick={() => handleMediaClick(fullUrl, item.type)}
                                      className="app-btn-outline-navy"
                                      style={{ padding: '6px 10px', fontSize: '11px', gap: '6px', borderRadius: '8px' }}
                                    >
                                      <div className={`app-icon-box ${item.colorClass}`} style={{ width: '22px', height: '22px', borderRadius: '6px' }}>
                                        <item.icon size={12} />
                                      </div>
                                      {item.label} {item.type === 'audio' ? 'Record' : item.type === 'video' ? 'Video' : 'Image'}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </CCol>
                        </CRow>
                      </div>
                    ) : (currentStatus === 'completed' || currentStatus === 'active') ? (
                      <div style={{ textAlign: 'center', padding: '20px 16px', background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', border: '1.5px dashed var(--c-border)' }}>
                        <button
                          className="app-btn-navy"
                          onClick={() => handleViewData(session.sessionId)}
                          disabled={loadingSessionId === session.sessionId}
                          style={{ margin: '0 auto' }}
                        >
                          {loadingSessionId === session.sessionId
                            ? <><CSpinner size="sm" /> Loading...</>
                            : <><Activity size={14} /> View Data</>}
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 16px', background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)', border: '1.5px dashed var(--c-border)' }}>
                        <AlertCircle size={22} color="var(--c-text-3)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', margin: 0 }}>Activity log pending for this session</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CModalBody>

      <CModalFooter style={{ border: 'none', padding: '12px 24px 18px', background: 'var(--c-surface)' }}>
        <button className="app-btn-outline-navy" onClick={onClose}>Close</button>
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

/* ── Main Page ───────────────────────────────────────────────── */
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
            clinicId, branchId, patientId, bookingId: id, therapistId, therapistRecordId
          });
          if (!abortController.signal.aborted) {
            let data = Array.isArray(response?.data) ? response.data : [];
            setSessions(data);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) console.error('Error fetching sessions:', error);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    };
    fetchSessions();
    return () => abortController.abort();
  }, [id, patientId, therapistRecordId, clinicId, branchId]);

  const handleCardClick = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  /* Loading */
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-ring" />
        <span className="app-loading-text">Synchronizing Activity Data…</span>
      </div>
    );
  }

  return (
    <motion.div className="app-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button
            className="app-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> Back to History
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="app-hero-title">Activity Sessions</h2>
              <p className="app-hero-sub">Click on an exercise card to view detailed session logs</p>
            </div>
            <span style={{
              background: 'rgba(249,115,22,0.22)', border: '1px solid rgba(249,115,22,0.35)',
              color: '#fdba74', borderRadius: 'var(--r-pill)', padding: '5px 14px',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
            }}>
              {sessions.length} Exercise{sessions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="app-body" style={{ marginTop: '-32px' }}>
        <CRow className="g-3">
          {sessions.length > 0 ? (
            sessions.map((item) => (
              <CCol key={item.exerciseId} xs={12} sm={6} lg={4} xl={3}>
                <ExerciseCard item={item} onClick={handleCardClick} />
              </CCol>
            ))
          ) : (
            <CCol xs={12}>
              <motion.div
                className="app-empty"
                style={{ padding: '72px 24px' }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Activity size={64} />
                <p style={{ fontWeight: 700, fontSize: '17px', color: 'var(--c-text)', margin: '0 0 6px' }}>
                  No Activity Sessions Found
                </p>
                <p style={{ fontSize: '13px', margin: 0 }}>Activity logs will appear here once sessions are scheduled.</p>
              </motion.div>
            </CCol>
          )}
        </CRow>
      </div>

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