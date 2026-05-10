import React, { useEffect, useState, useMemo, Activity } from 'react';
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
import { motion } from 'framer-motion';
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
      <CModalHeader className="border-0 px-4 pt-4 pb-0" closeButton={false}>
        <CModalTitle className="fw-bold d-flex align-items-center gap-2">
          {isYouTube ? <PlayCircle size={20} className="text-danger" /> : (type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />)}
          {isYouTube ? 'Exercise Tutorial' : (type === 'video' ? 'Video Update' : 'Media Preview')}
        </CModalTitle>
        <CButton variant="ghost" onClick={onClose} className="p-0 border-0"><X size={28} /></CButton>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="exercise-card-premium h-100 p-3 d-flex flex-column bg-white shadow-sm rounded-4 border">
        {/* Compact Header: Icon + Title */}
        <div className="d-flex align-items-start gap-3 mb-3">
          <div className="bg-primary bg-opacity-10 rounded-3 text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
            <Dumbbell size={20} />
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <h6 className="fw-bold text-dark m-0 line-clamp-2" title={item.exerciseName || item.programName} style={{ fontSize: '0.95rem', lineHeight: '1.3' }}>
                {item.exerciseName || item.programName}
              </h6>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                {item.noOfSets || '3'} Sets x {item.noOfRepetitions || '10'} Reps
              </span>
              <span className="badge bg-success bg-opacity-10 text-success px-2 py-1" style={{ fontSize: '0.7rem' }}>
                Daily
              </span>
            </div>
          </div>
        </div>

        {/* Compact Guidance */}
        {item.instructions && (
          <div className="mb-3">
            <p className="text-secondary small m-0 line-clamp-2" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              {item.instructions}
            </p>
          </div>
        )}

        {/* Compact Media Buttons */}
        <div className="d-flex flex-wrap gap-2 mb-3 mt-auto justify-content-start">
          {item.youtubeUrl && (
            <CButton
              color="danger"
              variant="outline"
              size="sm"
              className="d-flex align-items-center gap-1 rounded-pill px-3 py-1 border-danger"
              onClick={() => onPreview(item.youtubeUrl, 'youtube')}
              style={{ fontSize: '0.75rem', fontWeight: '600' }}
            >
              <PlayCircle size={14} /> Tutorial
            </CButton>
          )}
          {(() => {
            const ensureBase64Prefix = (str, type) => {
              if (!str || str === "null") return null;
              if (str.startsWith('data:') || str.startsWith('http')) return str;
              return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
            };

            const mediaItems = [
              { key: 'beforeImage', label: 'Before', type: 'image', icon: ImageIcon, color: 'primary' },
              { key: 'afterImage', label: 'After', type: 'image', icon: ImageIcon, color: 'primary' },
              { key: 'beforeVideo', label: 'Before', type: 'video', icon: Video, color: 'info' },
              { key: 'afterVideo', label: 'After', type: 'video', icon: Video, color: 'info' }
            ];

            return mediaItems.map(m => {
              const data = item[m.key];
              if (!data || data === "null") return null;
              const fullUrl = ensureBase64Prefix(data, m.type);
              return (
                <CButton
                  key={m.key}
                  color={m.color}
                  variant="ghost"
                  size="sm"
                  className={`d-flex align-items-center gap-1 rounded-pill px-2 py-1 bg-${m.color} bg-opacity-10`}
                  onClick={() => onPreview(fullUrl, m.type)}
                  style={{ fontSize: '0.7rem', fontWeight: '600' }}
                >
                  <m.icon size={12} /> {m.label}
                </CButton>
              );
            });
          })()}
        </div>

        {/* Compact Action */}
        <CButton
          className="btn-premium w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-3"
          style={{ fontSize: '0.85rem' }}
          onClick={() => onTrack(item)}
        >
          Track Progress <ChevronRight size={16} />
        </CButton>
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
      <CModalHeader className="border-0 px-4 pt-4 pb-0" closeButton={false}>
        <CModalTitle className="fw-bold fs-5 ls-n1 d-flex align-items-center gap-2">
          <Activity size={20} className="text-primary" /> Activity Log
        </CModalTitle>
        <CButton variant="ghost" onClick={onClose} className="p-0 border-0"><X size={24} /></CButton>
      </CModalHeader>

      <CModalBody className="p-4">
        {/* Compact Header */}
        <div className="mb-4 pb-3 border-bottom">
          <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2" style={{ lineHeight: '1.4' }}>
            <Dumbbell size={18} className="text-secondary flex-shrink-0" />
            <span className="line-clamp-2">{exercise.exerciseName || exercise.programName}</span>
          </h5>
          <p className="text-secondary small mt-2 mb-0">Record your actual performance for today</p>
        </div>

        {/* Dense Inputs */}
        <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
          <div className="flex-grow-1">
            <label className="text-secondary small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              Sets Completed (Goal: {exercise.noOfSets || '3'})
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                <TrendingUp size={16} />
              </span>
              <input
                type="number"
                value={setsDone}
                onChange={(e) => setSetsDone(e.target.value)}
                className="form-control border-start-0 ps-0 fw-bold bg-light shadow-none"
                style={{ fontSize: '1.1rem' }}
              />
            </div>
          </div>
          <div className="flex-grow-1">
            <label className="text-secondary small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              Reps per Set (Goal: {exercise.noOfRepetitions || '10'})
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                <Activity size={16} />
              </span>
              <input
                type="number"
                value={repsDone}
                onChange={(e) => setRepsDone(e.target.value)}
                className="form-control border-start-0 ps-0 fw-bold bg-light shadow-none"
                style={{ fontSize: '1.1rem' }}
              />
            </div>
          </div>
        </div>

        {/* Completion Toggle */}
        <div
          className="p-3 rounded-3 border transition-all mb-4 d-flex align-items-center justify-content-between cursor-pointer"
          style={{ backgroundColor: completed ? '#f0fdf4' : '#f8fafc', borderColor: completed ? '#bbf7d0' : '#e2e8f0' }}
          onClick={() => setCompleted(!completed)}
        >
          <div className="d-flex align-items-center gap-3">
            <div className={`d-flex align-items-center justify-content-center rounded-circle ${completed ? 'bg-success text-white' : 'bg-white text-secondary border'}`} style={{ width: '28px', height: '28px' }}>
              {completed ? <CheckCircle2 size={16} /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />}
            </div>
            <span className={`fw-bold ${completed ? 'text-success' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>
              I've completed this session
            </span>
          </div>
          <CFormCheck
            id="completionCheck"
            className="m-0"
            checked={completed}
            readOnly
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-secondary small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            Observations (Optional)
          </label>
          <textarea
            className="form-control bg-light rounded-3 p-3 shadow-none border"
            placeholder="How did you feel? Any specific pain areas?"
            rows="2"
            style={{ resize: 'none', borderColor: '#e2e8f0', fontSize: '0.85rem' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
      </CModalBody>

      <CModalFooter className="border-0 px-4 pb-4 pt-0">
        <CButton
          className="btn-premium w-100 py-2 fw-bold rounded-3 shadow-sm"
          style={{ background: 'var(--primary-gradient)', border: 'none', fontSize: '0.9rem' }}
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
            <Dumbbell size={48} className="text-white opacity-50 mb-3" />
          </motion.div>
          <h5 className="text-secondary opacity-75 fw-semibold tracking-wide">Fetching Your Routine...</h5>
        </div>
      </CContainer>
    );
  }

  return (
    <motion.div className="p-3 p-md-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="activity-header mb-5">
        <CButton
          variant="ghost"
          className="p-0 text-decoration-none text-secondary mb-4 d-flex align-items-center gap-2 hover-primary transition-all"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} /> Back to Visit History
        </CButton>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark m-0 d-flex align-items-center gap-3">
              Home Exercises
            </h2>
            <p className="text-secondary fw-medium mt-2 mb-0 d-flex align-items-center flex-wrap gap-2">
              <span className="badge bg-primary bg-opacity-10 text-white px-3 py-2 rounded-pill fw-bold" style={{ letterSpacing: '0.5px' }}>Daily Program</span>
              <span>Achieve faster recovery by staying consistent at home.</span>
            </p>
          </div>
          {exercises.length > 0 && (
            <div className="bg-white px-4 py-2 rounded-pill shadow-sm border d-inline-flex align-items-center gap-2">
              <Dumbbell size={18} className="text-primary" />
              <span className="fw-bold text-dark">{exercises.length}</span>
              <span className="text-secondary small fw-semibold">Exercises Assigned</span>
            </div>
          )}
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
            <div className="empty-state-container shadow-sm">
              <div className="bg-light rounded-circle d-inline-flex p-4 mb-4 shadow-sm border border-white">
                <Home size={60} className="text-secondary opacity-50" />
              </div>
              <h3 className="fw-bold text-dark mb-3">No Home Exercises Found</h3>
              <p className="text-secondary mx-auto" style={{ maxWidth: '400px', lineHeight: '1.6' }}>
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
