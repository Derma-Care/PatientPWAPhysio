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
  Activity,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { physiotherapyService, localPhysiotherapyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  const cleanUrl = mediaUrl.split('?')[0].toLowerCase();

  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const isYouTube =
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be');

  const isVideoFile = videoExtensions.some(ext =>
    cleanUrl.endsWith(ext)
  );

  const isImageFile = imageExtensions.some(ext =>
    cleanUrl.endsWith(ext)
  );

  const getYouTubeId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

    const match = url.match(regExp);

    return match && match[2].length === 11
      ? match[2]
      : null;
  };

  console.log({
    mediaUrl,
    type,
    isYouTube,
    isVideoFile,
    isImageFile
  });

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      alignment="center"
      className="premium-modal"
      backdrop="static"
    >
      <CModalHeader className="border-0 px-4 pt-4 pb-0">
        <CModalTitle className="fw-bold">
          Media Preview
        </CModalTitle>
      </CModalHeader>

      <CModalBody
        className="p-0 bg-black rounded-bottom-4 overflow-hidden d-flex justify-content-center align-items-center mt-3"
        style={{ minHeight: '350px' }}
      >
        {isYouTube ? (
          <iframe
            width="100%"
            height="350"
            src={`https://www.youtube.com/embed/${getYouTubeId(mediaUrl)}`}
            title="YouTube video player"
            frameBorder="0"
            allowFullScreen
          />
        ) : isVideoFile ? (
          <video
            src={mediaUrl}
            controls
            className="w-100"
            style={{ maxHeight: '70vh' }}
          />
        ) : isImageFile ? (
          <img
            src={mediaUrl}
            alt="Preview"
            className="img-fluid"
            style={{
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div className="text-white p-4">
            Unsupported Media Type
          </div>
        )}
      </CModalBody>
    </CModal>
  );
};

const HomeExerciseCard = React.memo(({ item, index, record, onTrack, onPreview, onViewProgress, viewingProgressId }) => {
  const isCompleted = String(record?.status || '').toUpperCase() === 'COMPLETED';
  const isActive =
    ['ACTIVE', 'Active', 'active'].includes(record?.status);
  const hasCompletedSession = record?.therapyrecord && record.therapyrecord.length > 0;
  const totalSessions = parseInt(item.session || item.noOfSessions || item.sessions || 10, 10);
  const completedSessions = record?.therapyrecord?.length || 0;
  const remainingSessions = Math.max(0, totalSessions - completedSessions);
  const exerciseId = item.id || item.exerciseId || item.programId || item.therapyExercisesId || '';

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
              {item.duration && (
                <span className="badge bg-info bg-opacity-10 text-info px-2 py-1" style={{ fontSize: '0.7rem' }}>
                  {item.duration}
                </span>
              )}
              <span className="badge bg-success bg-opacity-10 text-success px-2 py-1" style={{ fontSize: '0.7rem' }}>
                {item.frequency || '3 times a day'}
              </span>
              <span className="badge bg-warning bg-opacity-10 text-warning px-2 py-1" style={{ fontSize: '0.7rem' }}>
                {remainingSessions} sessions left
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
        <div className="d-flex gap-2 w-100 mt-2">
          {!isCompleted && (
            <CButton
              className="btn-premium flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-3"
              style={{ fontSize: '0.85rem' }}
              onClick={() => onTrack(item)}
            >
              Track Progress <ChevronRight size={16} />
            </CButton>
          )}
          {(hasCompletedSession || isActive) && (
            <CButton
              variant="outline"
              color="primary"
              className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-3"
              style={{ fontSize: '0.85rem', borderWidth: '1.5px' }}
              disabled={viewingProgressId === exerciseId}
              onClick={() => onViewProgress(item, exerciseId)}
            >
              {viewingProgressId === exerciseId ? (
                <><CSpinner size="sm" /> Loading...</>
              ) : (
                <>View Progress <TrendingUp size={16} /></>
              )}
            </CButton>
          )}
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
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const [beforeVideo, setBeforeVideo] = useState('');
  const [afterVideo, setAfterVideo] = useState('');

  useEffect(() => {
    if (exercise) {
      setSetsDone(exercise.noOfSets || '');
      setRepsDone(exercise.noOfRepetitions || '');
      setCompleted(false);
      setNotes('');
      setBeforeImage('');
      setAfterImage('');
      setBeforeVideo('');
      setAfterVideo('');
    }
  }, [exercise, visible]);

  const compressImage = (file, maxSizeMB) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          let quality = 0.9;
          const maxBytes = maxSizeMB * 1024 * 1024;

          const compress = () => {
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
            let bytes = Math.round((dataUrl.length * 3) / 4);

            if (bytes <= maxBytes || quality <= 0.1 || width <= 100) {
              resolve(dataUrl);
            } else {
              width = Math.floor(width * 0.8);
              height = Math.floor(height * 0.8);
              quality -= 0.1;
              compress();
            }
          };
          compress();
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e, key, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeInMB = file.size / (1024 * 1024);

    if (sizeInMB > 10) {
      Swal.fire({
        icon: 'error',
        title: 'File too large',
        text: `Maximum file size is 10MB. Please select a smaller file.`,
        customClass: { popup: 'premium-swal-popup' }
      });
      e.target.value = '';
      return;
    }

    const setBase64 = (base64Str) => {
      if (key === 'beforeImage') setBeforeImage(base64Str);
      else if (key === 'afterImage') setAfterImage(base64Str);
      else if (key === 'beforeVideo') setBeforeVideo(base64Str);
      else if (key === 'afterVideo') setAfterVideo(base64Str);
    };

    if (type === 'image' && sizeInMB > 1) {
      try {
        const compressedDataUrl = await compressImage(file, 1);
        setBase64(compressedDataUrl.split(',')[1]);
      } catch (error) {
        console.error("Compression failed", error);
        Swal.fire({
          icon: 'error',
          title: 'Compression failed',
          text: 'Could not compress the image.',
          customClass: { popup: 'premium-swal-popup' }
        });
        e.target.value = '';
      }
      return;
    }

    if (type === 'video' && sizeInMB > 1) {
      Swal.fire({
        icon: 'error',
        title: 'Video too large',
        text: `Video must be under 1MB. Browser compression for videos is not supported.`,
        customClass: { popup: 'premium-swal-popup' }
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      setBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  if (!exercise) return null;

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" className="premium-modal" size="md" backdrop="static">
      <CModalHeader className="border-0 px-4 pt-4 pb-0"  >
        <CModalTitle className="fw-bold fs-5 ls-n1 d-flex align-items-center gap-2">
          <Activity size={20} className="text-primary" /> Activity Log
        </CModalTitle>
        {/* <CButton variant="ghost" onClick={onClose} className="p-0 border-0"><X size={24} /></CButton> */}
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
        <div className="mb-4">
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

        {/* File Uploads (Before & After) */}
        <CRow className="g-3">
          <CCol md={6}>
            <div className="p-3 border rounded-3 bg-light h-100 d-flex flex-column gap-2">
              <h6 className="fw-bold mb-2 text-primary d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <ImageIcon size={16} /> Before Session
              </h6>
              <div>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                  Before Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={(e) => handleFileChange(e, 'beforeImage', 'image')}
                />
              </div>
              <div>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                  Before Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="form-control form-control-sm"
                  onChange={(e) => handleFileChange(e, 'beforeVideo', 'video')}
                />
              </div>
            </div>
          </CCol>
          <CCol md={6}>
            <div className="p-3 border rounded-3 bg-light h-100 d-flex flex-column gap-2">
              <h6 className="fw-bold mb-2 text-success d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <ImageIcon size={16} /> After Session
              </h6>
              <div>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                  After Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={(e) => handleFileChange(e, 'afterImage', 'image')}
                />
              </div>
              <div>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                  After Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="form-control form-control-sm"
                  onChange={(e) => handleFileChange(e, 'afterVideo', 'video')}
                />
              </div>
            </div>
          </CCol>
        </CRow>
      </CModalBody>

      <CModalFooter className="border-0 px-4 pb-4 pt-0">
        <CButton
          className="btn-premium w-100 py-2 fw-bold rounded-3 shadow-sm mt-3"
          style={{ background: 'var(--primary-gradient)', border: 'none', fontSize: '0.9rem' }}
          onClick={() => onSave({ exercise, setsDone: setsDone || '0', repsDone: repsDone || '0', notes, completed, beforeImage, afterImage, beforeVideo, afterVideo })}
        >
          {saving ? <CSpinner size="sm" /> : 'Save Activity Log'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

const ViewProgressModal = ({ record, visible, onClose, onPreview }) => {
  if (!record) return null;

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" className="premium-modal" size="lg" backdrop="static">
      <CModalHeader className="border-0 px-4 pt-4 pb-0" >
        <CModalTitle className="fw-bold fs-5 ls-n1 d-flex align-items-center gap-2">
          <TrendingUp size={20} className="text-primary" /> Exercise Progress History
        </CModalTitle>
        {/* <CButton variant="ghost" onClick={onClose} className="p-0 border-0"><X size={24} /></CButton> */}
      </CModalHeader>

      <CModalBody className="p-4">
        <div className="mb-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold text-dark m-0">{record.name ? `${record.name}'s Routine` : "Exercise Routine"}</h5>
            <p className="text-secondary small mt-1 mb-0">Logged sessions and observations</p>
          </div>
          <span className={`badge ${String(record.status || '').toLowerCase() === 'completed' ? 'bg-success' : 'bg-primary'} px-3 py-2 rounded-pill fw-bold`}>
            Status: {record.status || 'Unknown'}
          </span>
        </div>

        <div className="timeline-container" style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
          {record.therapyrecord?.map((session, index) => (
            <div key={index} className="mb-4 p-3 rounded-3 border bg-light position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                <span className="badge bg-primary px-2 py-1" style={{ fontSize: '0.75rem' }}>
                  Session {session.sessioncount} of {session.session}
                </span>
                <span className="text-secondary small fw-bold d-flex align-items-center gap-1">
                  <Calendar size={12} /> {session.date}
                </span>
              </div>

              <div className="d-flex flex-wrap gap-3 mb-3">
                <span className="small text-dark fw-semibold">
                  Sets Done: <span className="fw-bold text-primary">{session.setsdone}</span>
                </span>
                <span className="small text-dark fw-semibold">
                  Reps Done: <span className="fw-bold text-info">{session.repitationdone ?? 0}</span>
                </span>
                <span className="small text-dark fw-semibold">
                  Session Completed: <span className={`fw-bold ${session.sessioncompleted ? 'text-success' : 'text-danger'}`}>{session.sessioncompleted ? 'Yes' : 'No'}</span>
                </span>
              </div>

              {session.notes && (
                <div className="p-2 rounded bg-white border small text-secondary mb-3">
                  <strong>Notes:</strong> {session.notes}
                </div>
              )}

              {/* Media Previews in Timeline */}
              <div className="d-flex flex-wrap gap-2">
                {(() => {
                  const ensureBase64Prefix = (str, type) => {
                    if (!str || str === "null") return null;
                    if (str.startsWith('data:') || str.startsWith('http')) return str;
                    return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
                  };

                  const mediaItems = [
                    { key: 'beforeImage', label: 'Before Image', type: 'image', icon: ImageIcon, color: 'info' },
                    { key: 'afterImage', label: 'After Image', type: 'image', icon: ImageIcon, color: 'info' },
                    { key: 'beforeVideo', label: 'Before Video', type: 'video', icon: Video, color: 'info' },
                    { key: 'afterVideo', label: 'After Video', type: 'video', icon: Video, color: 'info' }
                  ];

                  return mediaItems.map(m => {
                    const data = session[m.key];
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
            </div>
          ))}
        </div>
      </CModalBody>
      <CModalFooter className="border-0 px-4 pb-4 pt-0">
        <CButton color="secondary" className="w-100 py-2 fw-bold rounded-3" onClick={onClose}>
          Close History
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
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [therapyRecords, setTherapyRecords] = useState({});
  const [patientName, setPatientName] = useState('');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewingProgressId, setViewingProgressId] = useState(null);

  const queryParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      patientId: query.get('patientId'),
      therapistRecordId: query.get('therapistRecordId'),
      clinicId: query.get('clinicId'),
      branchId: query.get('branchId'),
      doctorId: query.get('doctorId') || '',
    };
  }, [location.search]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const pid = queryParams.patientId;
        if (!pid) return;

        setPatientId(pid);

        let visit = location.state?.visit;

        if (!visit) {
          const response = await physiotherapyService.getVisitHistory({
            doctorId: queryParams.doctorId || '',
            patientId: pid,
            bookingId: id,
            clinicId: queryParams.clinicId || '',
            branchId: queryParams.branchId || ''
          });
          const resData = response.data;
          const history = resData ? (Array.isArray(resData) ? resData : [resData]) : [];

          // Find the specific visit matching therapistRecordId, or fallback to latest
          visit = queryParams.therapistRecordId
            ? history.find(v => v.physiotherapyDoctorData?.therapistRecordId === queryParams.therapistRecordId)
            : history[0];
        }

        if (!visit) return;

        const physioData = visit.physiotherapyDoctorData;

        // Extract doctorId from treatmentPlan (as per API response)
        const resolvedDoctorId =
          physioData?.treatmentPlan?.doctorId ||
          queryParams.doctorId ||
          "";
        if (resolvedDoctorId) setDoctorId(resolvedDoctorId);

        // Extract patientName from patientInfo (as per API response)
        const resolvedPatientName = physioData?.patientInfo?.patientName || "";
        if (resolvedPatientName) setPatientName(resolvedPatientName);

        // Use clinicId/branchId from visit data if not in URL
        const resolvedClinicId = queryParams.clinicId || physioData?.clinicId || "";
        const resolvedBranchId = queryParams.branchId || physioData?.branchId || "";

        // Build exercise list from homeExercises plan
        const homeExercisePlan = physioData?.exercisePlan?.homeExercises || [];
        const therapyPrograms = physioData?.therapySessions?.[0]?.programs || [];

        let allExercises = [];
        if (homeExercisePlan.length > 0) {
          allExercises = homeExercisePlan.map(ex => ({
            ...ex,
            exerciseName: ex.name,
            noOfSets: ex.sets,
            noOfRepetitions: ex.reps,
            instructions: ex.instructions,
            youtubeUrl: ex.videoUrl,
          }));
        } else {
          allExercises = therapyPrograms;
        }

        setExercises(allExercises);

        // Fetch existing therapy records for each exercise
        const recordsMap = {};
        if (resolvedClinicId && resolvedBranchId) {
          await Promise.all(
            allExercises.map(async (ex) => {
              const exId = (ex.id && ex.id.trim()) || ex.exerciseId || ex.programId || ex.therapyExercisesId
                || (ex.name ? ex.name.trim().replace(/\s+/g, '_').toUpperCase() : '');
              if (exId) {
                try {
                  const record = await localPhysiotherapyService.getByClinicBranchExercise(
                    resolvedClinicId,
                    resolvedBranchId,
                    queryParams.therapistRecordId || "",
                    pid || "",
                    exId
                  );
                  if (record && record.success !== false) {
                    recordsMap[exId] = Array.isArray(record.data)
                      ? record.data[0]
                      : (record.data || record);
                  }
                } catch (err) {
                  console.warn(`No existing therapy record for exercise ${exId}:`, err);
                }
              }
            })
          );
        }
        setTherapyRecords(recordsMap);
      } catch (error) {
        console.error('Error fetching home exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [id, queryParams.patientId, queryParams.therapistRecordId, queryParams.clinicId, queryParams.branchId, queryParams.doctorId]);

  const handleTrack = (exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const handlePreview = (url, type) => {
    setPreviewData({ visible: true, url, type });
  };

  const handleSave = async (data) => {
    console.log("data", data)
    try {
      setSaving(true);
      const exerciseId = (data.exercise.exerciseId && data.exercise.exerciseId.trim())
        || data.exercise.exerciseId
        || data.exercise.programId
        || data.exercise.therapyExercisesId
        || (data.exercise.name ? data.exercise.name.trim().replace(/\s+/g, '_').toUpperCase() : '')
        || "";
      const existingRecord = therapyRecords[exerciseId];

      const totalSessions = parseInt(data.exercise.session || data.exercise.noOfSessions || data.exercise.sessions || 10, 10);
      const sessionCountDone = existingRecord ? (existingRecord.therapyrecord?.length || 0) + 1 : 1;
      const remainingSessions = Math.max(0, totalSessions - sessionCountDone);

      const newSession = {
        setsdone: parseInt(data.setsDone, 10) || 0,
        repitationdone: parseInt(data.repsDone, 10) || 0,
        sessioncount: sessionCountDone,
        session: totalSessions,
        sessioncompleted: data.completed,
        date: new Date().toISOString().split('T')[0],
        excerciseId: exerciseId,
        notes: data.notes || "",
        beforeImage: data.beforeImage || "",
        afterImage: data.afterImage || "",
        beforeVideo: data.beforeVideo || "",
        afterVideo: data.afterVideo || ""
      };

      const isStatusCompleted = sessionCountDone >= totalSessions;

      let updatedRecord;
      if (existingRecord) {
        const updatedSessions = [...(existingRecord.therapyrecord || []), newSession];
        updatedRecord = {
          ...existingRecord,
          therapyrecordid: queryParams.therapistRecordId || "",
          clincinid: queryParams.clinicId || "",
          brnchid: queryParams.branchId || "",
          patientid: patientId || "",
          doctorid: doctorId || "",
          name: patientName || "",
          status: isStatusCompleted ? "COMPLETED" : "ACTIVE",
          excerciseId: exerciseId,
          therapyrecord: updatedSessions
        };
      } else {
        updatedRecord = {
          therapyrecordid: queryParams.therapistRecordId || "",
          clincinid: queryParams.clinicId || "",
          brnchid: queryParams.branchId || "",
          patientid: patientId || "",
          doctorid: doctorId || "",
          name: patientName || "",
          status: isStatusCompleted ? "COMPLETED" : "ACTIVE",
          excerciseId: exerciseId,
          therapyrecord: [newSession]
        };
      }

      console.log("========== THERAPY RECORD PAYLOAD ==========");
      console.log("Existing Record Found:", !!existingRecord);
      console.log("Exercise ID:", exerciseId);
      console.log("Total Sessions Expected:", totalSessions);
      console.log("Current Session Count:", sessionCountDone);
      console.log("Full Payload to Send:", JSON.stringify(updatedRecord, null, 2));
      console.log("=========================================");

      let response;
      if (existingRecord) {
        const recordId = queryParams.therapistRecordId;
        console.log("Updating existing record with ID:", recordId, "exercise:", exerciseId);
        console.log("PUT Endpoint: /api/customer/therapy-records/update/" + recordId + "/" + exerciseId);
        response = await localPhysiotherapyService.updateTherapyRecord(recordId, exerciseId, updatedRecord);
        console.log("Update Response:", response);
      } else {
        console.log("Creating new therapy record");
        console.log("POST Endpoint: /api/customer/therapy-records/create");
        response = await localPhysiotherapyService.createTherapyRecord(updatedRecord);
        console.log("Create Response:", response);
      }

      // Re-fetch the therapy record for this exercise
      try {
        const freshRecord = await localPhysiotherapyService.getByClinicBranchExercise(
          queryParams.clinicId || "",
          queryParams.branchId || "",
          queryParams.therapistRecordId || "",
          patientId || "",
          exerciseId
        );
        if (freshRecord && freshRecord.success !== false) {
          console.log("Fresh record after save:", freshRecord);
          setTherapyRecords(prev => ({
            ...prev,
            [exerciseId]: Array.isArray(freshRecord.data)
              ? freshRecord.data[0]
              : (freshRecord.data || freshRecord)
          }));
        }
      } catch (err) {
        console.error("Error re-fetching therapy record after save:", err);
      }

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
      console.error("========== SAVE ERROR ==========");
      console.error("Error Message:", error.message);
      console.error("Error Status:", error.response?.status);
      console.error("Error Data:", error.response?.data);
      console.error("Full Error:", error);
      console.error("===============================");

      setModalVisible(false);
      Swal.fire({
        icon: 'error',
        title: 'Error Logging Progress',
        text: error.response?.data?.message || 'There was an issue saving your progress. Please try again.',
        timer: 3000,
        showConfirmButton: true
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewProgress = async (item, exerciseId) => {
    setViewingProgressId(exerciseId);
    try {
      const clinicId = queryParams.clinicId || '';
      const branchId = queryParams.branchId || '';
      const therapistRecordId = queryParams.therapistRecordId || '';
      const patientId = queryParams.patientId || '';
      const res = await localPhysiotherapyService.getByClinicBranchExercise(
        clinicId, branchId, therapistRecordId, patientId, exerciseId
      );
      const freshRecord = (res && res.success !== false)
        ? (
          Array.isArray(res.data)
            ? res.data[0]
            : (res.data || res)
        )
        : (therapyRecords[exerciseId] || null);
      setSelectedRecord(freshRecord);
      setViewModalVisible(true);
    } catch (err) {
      console.error('Error fetching progress record:', err);
      // Fall back to cached record if fetch fails
      setSelectedRecord(therapyRecords[exerciseId] || null);
      setViewModalVisible(true);
    } finally {
      setViewingProgressId(null);
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
          exercises.map((item, index) => {
            const exerciseId = item.id || item.exerciseId || item.programId || item.therapyExercisesId || "";
            return (
              <CCol key={index} xs={12} sm={6} lg={4} xl={3}>
                <HomeExerciseCard
                  item={item}
                  index={index}
                  record={therapyRecords[exerciseId]}
                  onTrack={handleTrack}
                  onPreview={handlePreview}
                  onViewProgress={handleViewProgress}
                  viewingProgressId={viewingProgressId}
                />
              </CCol>
            );
          })
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

      <ViewProgressModal
        record={selectedRecord}
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        onPreview={handlePreview}
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
