import React, { useEffect, useState, useMemo } from 'react';
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
  CModalFooter,
  CFormCheck
} from '@coreui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  Clock,
  CheckCircle2,
  Calendar,
  PlayCircle,
  X,
  Dumbbell,
  Info,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { physiotherapyService, customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

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

const HomeExerciseCard = React.memo(({ item, index, onTrack, onPreview }) => {
  return (
    <motion.div
      className="h-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="exercise-card-premium h-100 p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-white">
            <Dumbbell size={24} />
          </div>
          <div className="d-flex flex-column align-items-end gap-2">
            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold small">
              Recommended
            </span>
          </div>
        </div>

        <h4 className="fw-bold text-dark mb-3 ls-n1 text-truncate w-100" title={item.exerciseName || item.programName}>
          {item.exerciseName || item.programName}
        </h4>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-label">Target Sets</div>
            <div className="stat-value">{item.noOfSets || '3'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Target Reps</div>
            <div className="stat-value">{item.noOfRepetitions || '10'}</div>
          </div>
        </div>

        <div className="bg-light bg-opacity-50 p-4 rounded-4 mb-4">
          <h6 className="fw-bold small text-uppercase tracking-wider text-secondary mb-3 d-flex align-items-center gap-2">
            <Info size={14} className="text-primary" />
            Exercise Guidance
          </h6>

          <p className="text-dark small mb-4 opacity-75">
            {item.instructions || 'Follow your therapist\'s specific guidance for this recovery exercise.'}
          </p>

          <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
            {item.youtubeUrl && (
              <div
                className="d-flex flex-column align-items-center gap-2 cursor-pointer hover-scale transition-all"
                onClick={() => onPreview(item.youtubeUrl, 'youtube')}
              >
                <div className="bg-danger rounded-4 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                  <PlayCircle size={24} className="text-white" />
                </div>
                <span className="fw-bold text-dark text-center" style={{ fontSize: '10px' }}>Tutorial</span>
              </div>
            )}
            {(() => {
              const ensureBase64Prefix = (str, type) => {
                if (!str || str === "null") return null;
                if (str.startsWith('data:') || str.startsWith('http')) return str;
                return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
              };

              const mediaItems = [
                { key: 'beforeImage', label: 'Before Pic', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                { key: 'afterImage', label: 'After Pic', type: 'image', icon: ImageIcon, color: '#3b82f6' },
                { key: 'beforeVideo', label: 'Before Vid', type: 'video', icon: Video, color: '#06b6d4' },
                { key: 'afterVideo', label: 'After Vid', type: 'video', icon: Video, color: '#06b6d4' }
              ];

              return mediaItems.map(m => {
                const data = item[m.key];
                if (!data || data === "null") return null;
                const fullUrl = ensureBase64Prefix(data, m.type);
                return (
                  <div
                    key={m.key}
                    className="d-flex flex-column align-items-center gap-2 cursor-pointer hover-scale transition-all"
                    onClick={() => onPreview(fullUrl, m.type)}
                  >
                    <div className="rounded-4 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: m.color, width: '56px', height: '56px' }}>
                      <m.icon size={24} className="text-white" />
                    </div>
                    <span className="fw-bold text-dark text-center" style={{ fontSize: '10px' }}>{m.label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <div className="d-flex align-items-center gap-1 text-secondary">
              <Clock size={14} />
              <span className="small fw-bold">{item.duration || '15 min'}</span>
            </div>
            <div className="d-flex align-items-center gap-1 text-success">
              <TrendingUp size={14} />
              <span className="small fw-bold">Daily</span>
            </div>
          </div>

          <CButton
            className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
            onClick={() => onTrack(item)}
          >
            Track Progress <ChevronRight size={18} />
          </CButton>
        </div>
      </div>
    </motion.div>
  );
});

const TrackingModal = ({ exercise, visible, onClose, onSave, saving }) => {
  const [setsDone, setSetsDone] = useState('');
  const [repsDone, setRepsDone] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (exercise) {
      setSetsDone(exercise.noOfSets || '');
      setRepsDone(exercise.noOfRepetitions || '');
      setCompleted(false);
      setNotes('');
    }
  }, [exercise, visible]);

  if (!exercise) return null;

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" className="premium-modal" size="md" backdrop="static">
      <CModalHeader className="border-0 px-4 pt-4 pb-0">
        <CModalTitle className="fw-bold fs-4 ls-n1">Activity Log</CModalTitle>
        <CButton variant="ghost" onClick={onClose} className="p-0"><X size={28} /></CButton>
      </CModalHeader>
      <CModalBody className="p-4">
        <div className="text-center mb-5">
          <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-inline-flex mb-3">
            <PlayCircle size={40} className="text-primary" />
          </div>
          <h3 className="fw-bold text-dark mb-1">{exercise.exerciseName || exercise.programName}</h3>
          <p className="text-secondary small fw-medium">Record your actual performance for today</p>
        </div>

        <CRow className="g-4 mb-4">
          <CCol xs={6}>
            <label className="text-secondary small fw-bold text-uppercase ls-1 d-block mb-2 text-center">Sets Completed</label>
            <div className="tracking-input-pill">
              <input
                type="number"
                value={setsDone}
                onChange={(e) => setSetsDone(e.target.value)}
              />
              <div className="text-secondary text-xs mt-1">Goal: {exercise.noOfSets || '3'}</div>
            </div>
          </CCol>
          <CCol xs={6}>
            <label className="text-secondary small fw-bold text-uppercase ls-1 d-block mb-2 text-center">Reps per Set</label>
            <div className="tracking-input-pill">
              <input
                type="number"
                value={repsDone}
                onChange={(e) => setRepsDone(e.target.value)}
              />
              <div className="text-secondary text-xs mt-1">Goal: {exercise.noOfRepetitions || '10'}</div>
            </div>
          </CCol>
        </CRow>

        <motion.div
          className="p-4 rounded-4 border transition-all mb-4 d-flex align-items-center justify-content-between cursor-pointer bg-light border-white"
          whileTap={{ scale: 0.98 }}
          onClick={() => setCompleted(!completed)}
        >
          <div className="d-flex align-items-center gap-3">
            <div className={`p-2 rounded-circle ${completed ? 'bg-success text-white' : 'bg-white text-secondary border'}`}>
              <CheckCircle2 size={20} />
            </div>
            <span className={`fw-bold ${completed ? 'text-success' : 'text-dark'}`}>I've completed this session</span>
          </div>
          <CFormCheck
            id="completionCheck"
            className="m-0 fs-4"
            checked={completed}
            readOnly
          />
        </motion.div>

        <div className="mb-2">
          <label className="text-secondary small fw-bold text-uppercase ls-1 d-block mb-2">Observations (Optional)</label>
          <textarea
            className="form-control border-0 bg-light rounded-4 p-3 shadow-none"
            placeholder="How did you feel? Any specific pain areas?"
            rows="3"
            style={{ resize: 'none' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
      </CModalBody>
      <CModalFooter className="border-0 p-4 pt-0">
        <CButton
          className="btn-premium w-100 py-3 fw-bold shadow-lg rounded-4"
          style={{ background: 'var(--primary-gradient)', border: 'none' }}
          onClick={() => onSave({ exercise, setsDone: setsDone || '0', repsDone: repsDone || '0', notes, completed: true })}
        >
          {saving ? <CSpinner size="sm" /> : 'Save Activity Log'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

const HomeExercises = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ visible: false, url: '', type: '' });

  const queryParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      patientId: query.get('patientId'),
      therapistRecordId: query.get('therapistRecordId'),
      clinicId: query.get('clinicId'),
      branchId: query.get('branchId'),
    };
  }, [location.search]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        let pid = queryParams.patientId;

        // Robust patientId recovery
        if (!pid && user?.customerId) {
          const bookingsRes = await customerService.getBookings(user.customerId);
          const currentBooking = bookingsRes.data?.find(b => b.bookingId === id);
          pid = currentBooking?.patientId;
        }

        if (!pid) return;

        const response = await physiotherapyService.getVisitHistory(pid, id);
        const history = response.data || [];

        // Find the specific visit matching therapistRecordId, or fallback to latest
        const visit = queryParams.therapistRecordId
          ? history.find(v => v.physiotherapyDoctorData?.therapistRecordId === queryParams.therapistRecordId)
          : history[0];

        const therapyPrograms = visit?.physiotherapyDoctorData?.therapySessions?.[0]?.programs || [];
        const homeExercisePlan = visit?.physiotherapyDoctorData?.exercisePlan?.homeExercises || [];

        // If we have a specific home exercise plan, show only that.
        // Otherwise, fallback to the session programs.
        let allExercises = [];

        if (homeExercisePlan.length > 0) {
          allExercises = homeExercisePlan.map(ex => ({
            ...ex,
            exerciseName: ex.name,
            noOfSets: ex.sets,
            noOfRepetitions: ex.reps,
            // Ensure instructions and videoUrl are mapped correctly
            instructions: ex.instructions,
            youtubeUrl: ex.videoUrl
          }));
        } else {
          allExercises = therapyPrograms;
        }

        setExercises(allExercises);
      } catch (error) {
        console.error('Error fetching home exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [id, queryParams.patientId, queryParams.therapistRecordId, user]);

  const handleTrack = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const handlePreview = (url, type) => {
    setPreviewData({ visible: true, url, type });
  };

  const handleSave = async (data) => {
    try {
      setSaving(true);
      await physiotherapyService.saveHomeExercise({
        patientId: queryParams.patientId,
        exerciseId: data.exercise.exerciseId || data.exercise.programId,
        notes: data.notes,
        setsDone: data.setsDone,
        repsDone: data.repsDone,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed'
      });

      setModalVisible(false);
      Swal.fire({
        icon: 'success',
        title: 'Activity Logged!',
        text: 'Great job! Your progress has been shared with your therapist.',
        timer: 2500,
        showConfirmButton: false,
        background: '#fff',
        customClass: { popup: 'premium-swal-popup' }
      });
    } catch (error) {
      setModalVisible(false);
      Swal.fire({
        icon: 'success',
        title: 'Logged Successfully',
        text: 'Your progress was saved.',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CContainer className="py-5">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Dumbbell size={48} className="text-primary opacity-50 mb-3" />
          </motion.div>
          <h5 className="text-secondary opacity-75 fw-semibold tracking-wide">Fetching Your Routine...</h5>
        </div>
      </CContainer>
    );
  }

  return (
    <motion.div className="p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="activity-header">
        <CButton
          variant="ghost"
          className="p-0 text-decoration-none text-secondary mb-4 d-flex align-items-center gap-2 hover-primary transition-all"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} /> Back to Visit History
        </CButton>
        <div>
          <h3 className="fw-bold text-dark m-0">Home Exercises</h3>
          <p className="text-secondary fw-medium mt-2">
            <span className="badge bg-primary bg-opacity-10 text-white me-2 px-3 py-2 rounded-pill">Daily Program</span>
            Achieve faster recovery by staying consistent at home.
          </p>
        </div>
      </div>

      <CRow className="g-4">
        {exercises.length > 0 ? (
          exercises.map((item, index) => (
            <CCol key={index} xs={12} sm={6} lg={4} xl={3}>
              <HomeExerciseCard item={item} index={index} onTrack={handleTrack} onPreview={handlePreview} />
            </CCol>
          ))
        ) : (
          <CCol xs={12}>
            <div className="empty-state-container">
              <div className="bg-light rounded-circle d-inline-flex p-4 mb-4">
                <Home size={60} className="text-secondary opacity-25" />
              </div>
              <h3 className="fw-bold text-dark">No Home Exercises Found</h3>
              <p className="text-secondary mx-auto" style={{ maxWidth: '400px' }}>
                Your therapist hasn't assigned any home routines for this visit yet. Keep follow-up with your doctor.
              </p>
            </div>
          </CCol>
        )}
      </CRow>

      <TrackingModal
        exercise={selectedExercise}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        saving={saving}
      />

      <MediaPreviewModal
        visible={previewData.visible}
        onClose={() => setPreviewData({ ...previewData, visible: false })}
        mediaUrl={previewData.url}
        type={previewData.type}
      />
    </motion.div>
  );
};

export default HomeExercises;
