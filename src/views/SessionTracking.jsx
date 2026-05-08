import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
  CButton,
  CBadge,
  CContainer,
} from '@coreui/react';
import { 
  ArrowLeft, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { physiotherapyService } from '../services/api';

const expandedStyle = { background: '#f1f5f9' };
const normalStyle = { background: 'white' };

// Separate Memoized Component for each Exercise Card
const ExerciseCard = React.memo(({ item, isExpanded, onToggle }) => {
  const [showAll, setShowAll] = useState(false);
  const sessionsToShow = showAll ? (item.sessions || []) : (item.sessions?.slice(0, 5) || []);

  return (
    <CCard className="premium-card border-0 overflow-hidden mb-4">
      <CCardBody className="p-0">
        <div 
          className="p-4 d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => onToggle(item.exerciseId)}
          style={isExpanded ? expandedStyle : normalStyle}
        >
          <div className="d-flex align-items-center gap-3">
            <div className={`p-3 rounded-3 ${isExpanded ? 'bg-primary text-white' : 'bg-light text-primary'}`}>
              <Activity size={24} />
            </div>
            <div>
              <h5 className="m-0 fw-bold text-dark">{item.exerciseName}</h5>
              <div className="small text-secondary fw-semibold">
                {item.sessions?.length || 0} Session{(item.sessions?.length !== 1) ? 's' : ''} Scheduled
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </div>
        </div>

        {/* PERFORMANCE FIX: Removed CCollapse for standard div to avoid heavy animations */}
        {isExpanded && (
          <div className="p-4 border-top bg-white">
            <div className="d-flex flex-column gap-3">
              {sessionsToShow.map((session, sIdx) => (
                <div key={`${item.exerciseId}-${session.sessionNo}`} className="p-3 border bg-light bg-opacity-50">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white px-2 py-1 border small fw-bold">Session {session.sessionNo}</div>
                      <div className="small text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Clock size={14} /> {session.date}
                      </div>
                    </div>
                    <CBadge 
                      color={session.status === 'Completed' ? 'success' : 'warning'} 
                      className={`px-3 py-2 fw-bold ${session.status === 'Completed' ? 'text-white' : 'text-dark'}`}
                    >
                      {session.status}
                    </CBadge>
                  </div>

                  {session.therapistRecord ? (
                    <div className="bg-white p-3 border-start border-4 border-success">
                      <CRow className="g-3">
                        <CCol md={6}>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Completion Time:</span>
                            <span className="fw-bold text-dark">{session.therapistRecord.completedTime}</span>
                          </div>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Pain Scale:</span>
                            <div className="d-flex align-items-center gap-3 mt-1">
                              <div className="text-center">
                                <div className="small text-secondary">Before</div>
                                <CBadge color="info" className="fs-6">{session.therapistRecord.painBefore}</CBadge>
                              </div>
                              <div className="text-secondary">→</div>
                              <div className="text-center">
                                <div className="small text-secondary">After</div>
                                <CBadge color="danger" className="fs-6">{session.therapistRecord.painAfter}</CBadge>
                              </div>
                            </div>
                          </div>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Sets & Reps:</span>
                            <span className="fw-bold text-dark">Sets: {session.therapistRecord.setsDone} | Reps: {session.therapistRecord.repetationDone}</span>
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Therapist Notes:</span>
                            <span className="fw-semibold text-dark italic">"{session.therapistRecord.therapistNotes}"</span>
                          </div>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Patient Response:</span>
                            <CBadge color="success" variant="outline" className="mt-1">{session.therapistRecord.patientResponse}</CBadge>
                          </div>
                          
                          <div className="d-flex gap-2 mt-2">
                            {session.therapistRecord.beforeImage && session.therapistRecord.beforeImage !== "null" && (
                              <CButton 
                                color="light" 
                                size="sm" 
                                className="d-flex align-items-center gap-2 border"
                                onClick={() => window.open(session.therapistRecord.beforeImage, '_blank')}
                              >
                                <ImageIcon size={14} /> Media
                              </CButton>
                            )}
                            {session.therapistRecord.beforeVideo && session.therapistRecord.beforeVideo !== "null" && (
                              <CButton 
                                color="light" 
                                size="sm" 
                                className="d-flex align-items-center gap-2 border"
                                onClick={() => window.open(session.therapistRecord.beforeVideo, '_blank')}
                              >
                                <Video size={14} /> Video
                              </CButton>
                            )}
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  ) : (
                    <div className="text-center py-3 border border-dashed">
                      <div className="text-secondary opacity-50 small d-flex align-items-center justify-content-center gap-2">
                        <Clock size={16} /> Pending Session Activity
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {item.sessions?.length > 5 && !showAll && (
                <div className="text-center mt-2">
                  <CButton color="link" size="sm" onClick={(e) => { e.stopPropagation(); setShowAll(true); }}>
                    Show all {item.sessions.length} sessions
                  </CButton>
                </div>
              )}
            </div>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
});

const SessionTracking = () => {
  console.count('SessionTracking Render');
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState(null);
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
            if (data.length > 15) data = data.slice(0, 15);
            setSessions(data);
            setExpandedExercise(null);
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

  const handleToggle = useCallback((exerciseId) => {
    setExpandedExercise(prev => prev === exerciseId ? null : exerciseId);
  }, []);

  if (loading) {
    return (
      <CContainer className="py-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <CSpinner color="primary" variant="grow" className="mb-3" />
          <h5 className="text-secondary opacity-75 fw-semibold">Loading Sessions...</h5>
        </div>
      </CContainer>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-4">
        <CButton 
          color="link" 
          className="p-0 text-decoration-none text-secondary mb-3 d-flex align-items-center gap-2" 
          onClick={() => navigate(`/bookings/${id}/history`)}
        >
          <ArrowLeft size={18} /> Back to History
        </CButton>
        <h2 className="fw-bold text-dark m-0">Activity Sessions</h2>
        <p className="text-secondary small">Medical activity tracking</p>
      </div>

      <CRow>
        <CCol lg={10} className="mx-auto">
          {sessions.length > 0 ? (
            <div className="d-flex flex-column">
              {sessions.map((item) => (
                <ExerciseCard 
                  key={item.exerciseId} 
                  item={item} 
                  isExpanded={expandedExercise === item.exerciseId}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <Activity size={64} className="text-secondary opacity-25 mb-3" />
              <h4>No activity sessions</h4>
            </div>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default SessionTracking;
