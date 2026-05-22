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

/* ── Media Preview Modal ─────────────────────────────────────── */
const MediaPreviewModal = ({ visible, onClose, mediaUrl, type }) => {
  if (!mediaUrl) return null;

  const cleanUrl = mediaUrl.split('?')[0].toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  const isVideoFile = videoExtensions.some(ext => cleanUrl.endsWith(ext));
  const isImageFile = imageExtensions.some(ext => cleanUrl.endsWith(ext));

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  console.log({ mediaUrl, type, isYouTube, isVideoFile, isImageFile });

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader style={{ border: 'none', padding: '18px 22px 10px' }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--c-text)' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '34px', height: '34px', borderRadius: '9px' }}>
            {isYouTube || isVideoFile ? <Video size={16} /> : <ImageIcon size={16} />}
          </div>
          Media Preview
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ padding: 0, background: '#0f172a', borderRadius: '0 0 16px 16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
        {isYouTube ? (
          <iframe width="100%" height="350" src={`https://www.youtube.com/embed/${getYouTubeId(mediaUrl)}`} title="YouTube video player" frameBorder="0" allowFullScreen />
        ) : isVideoFile ? (
          <video src={mediaUrl} controls className="w-100" style={{ maxHeight: '70vh' }} />
        ) : isImageFile ? (
          <img src={mediaUrl} alt="Preview" className="img-fluid" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
        ) : (
          <div style={{ color: '#fff', padding: '32px' }}>Unsupported Media Type</div>
        )}
      </CModalBody>
    </CModal>
  );
};

/* ── Exercise Card ───────────────────────────────────────────── */
const HomeExerciseCard = React.memo(({ item, index, record, onTrack, onPreview, onViewProgress, viewingProgressId }) => {
  const [hovered, setHovered] = useState(false);
  const isCompleted = String(record?.status || '').toUpperCase() === 'COMPLETED';
  const isActive = ['ACTIVE', 'Active', 'active'].includes(record?.status);
  const hasCompletedSession = record?.therapyrecord && record.therapyrecord.length > 0;
  const totalSessions = parseInt(item.session || item.noOfSessions || item.sessions || 10, 10);
  const completedSessions = record?.therapyrecord?.length || 0;
  const remainingSessions = Math.max(0, totalSessions - completedSessions);
  const progress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const exerciseId = item.id || item.exerciseId || item.programId || item.therapyExercisesId || '';

  return (
    <motion.div
      className="h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className="app-booking-item h-100 d-flex flex-column"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'default',
          transform: hovered ? 'translateY(-2px)' : 'none',
          boxShadow: hovered ? 'var(--s-lg)' : 'var(--s-sm)',
          borderColor: hovered ? 'var(--c-navy-light)' : 'var(--c-border)',
          transition: 'all 0.2s',
          padding: '16px',
        }}
      >
        {/* Header: Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
            <Dumbbell size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
              color: 'var(--c-text)', lineHeight: '1.3', marginBottom: '8px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }} title={item.exerciseName || item.programName}>
              {item.exerciseName || item.programName}
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              <span style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-pill)', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                {item.noOfSets || '3'}×{item.noOfRepetitions || '10'}
              </span>
              {item.duration && (
                <span style={{ background: 'var(--c-info-light)', color: 'var(--c-info)', borderRadius: 'var(--r-pill)', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                  {item.duration}
                </span>
              )}
              <span style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', borderRadius: 'var(--r-pill)', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                {item.frequency || '3×/day'}
              </span>
              <span style={{ background: 'var(--c-warning-light)', color: 'var(--c-warning)', borderRadius: 'var(--r-pill)', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                {remainingSessions} left
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {item.instructions && (
          <p style={{ fontSize: '12px', color: 'var(--c-text-2)', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.instructions}
          </p>
        )}

        {/* Progress bar */}
        {completedSessions > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{completedSessions}/{totalSessions} Sessions</span>
              <span style={{ fontSize: '10px', color: 'var(--c-navy)', fontWeight: 800 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--c-surface-3)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
                style={{ height: '100%', background: progress === 100 ? 'var(--c-success)' : 'var(--g-navy-soft)', borderRadius: 'var(--r-pill)' }}
              />
            </div>
          </div>
        )}

        {/* Media Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {item.youtubeUrl && (
            <button
              className="app-btn-outline-navy"
              onClick={() => onPreview(item.youtubeUrl, 'youtube')}
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', gap: '5px', borderColor: '#ef4444', color: '#ef4444', background: '#fee2e2' }}
            >
              <PlayCircle size={12} /> Tutorial
            </button>
          )}
          {(() => {
            const ensureBase64Prefix = (str, type) => {
              if (!str || str === "null") return null;
              if (str.startsWith('data:') || str.startsWith('http')) return str;
              return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
            };
            const mediaItems = [
              { key: 'beforeImage', label: 'Before', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
              { key: 'afterImage', label: 'After', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
              { key: 'beforeVideo', label: 'Before', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
              { key: 'afterVideo', label: 'After', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
            ];
            return mediaItems.map(m => {
              const data = item[m.key];
              if (!data || data === "null") return null;
              const fullUrl = ensureBase64Prefix(data, m.type);
              return (
                <button
                  key={m.key}
                  className="app-btn-outline-navy"
                  onClick={() => onPreview(fullUrl, m.type)}
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', gap: '5px' }}
                >
                  <m.icon size={12} /> {m.label} {m.type === 'video' ? 'Vid' : 'Img'}
                </button>
              );
            });
          })()}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          {!isCompleted && (
            <button
              className="app-btn-navy"
              onClick={() => onTrack(item)}
              style={{ flex: 1, justifyContent: 'center', padding: '9px 12px', fontSize: '12px', borderRadius: '10px' }}
            >
              Track Progress <ChevronRight size={14} />
            </button>
          )}
          {(hasCompletedSession || isActive) && (
            <button
              className="app-btn-outline-navy"
              disabled={viewingProgressId === exerciseId}
              onClick={() => onViewProgress(item, exerciseId)}
              style={{ flex: 1, justifyContent: 'center', padding: '9px 12px', fontSize: '12px', borderRadius: '10px' }}
            >
              {viewingProgressId === exerciseId
                ? <><CSpinner size="sm" /> Loading…</>
                : <>View Progress <TrendingUp size={14} /></>}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/* ── Tracking Modal ──────────────────────────────────────────── */
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
      setCompleted(false); setNotes('');
      setBeforeImage(''); setAfterImage('');
      setBeforeVideo(''); setAfterVideo('');
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
          let width = img.width, height = img.height, quality = 0.9;
          const maxBytes = maxSizeMB * 1024 * 1024;
          const compress = () => {
            canvas.width = width; canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            let dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
            let bytes = Math.round((dataUrl.length * 3) / 4);
            if (bytes <= maxBytes || quality <= 0.1 || width <= 100) { resolve(dataUrl); }
            else { width = Math.floor(width * 0.8); height = Math.floor(height * 0.8); quality -= 0.1; compress(); }
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
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Maximum file size is 10MB.', customClass: { popup: 'premium-swal-popup' } });
      e.target.value = ''; return;
    }
    const setBase64 = (b) => {
      if (key === 'beforeImage') setBeforeImage(b);
      else if (key === 'afterImage') setAfterImage(b);
      else if (key === 'beforeVideo') setBeforeVideo(b);
      else if (key === 'afterVideo') setAfterVideo(b);
    };
    if (type === 'image' && sizeInMB > 1) {
      try { const c = await compressImage(file, 1); setBase64(c.split(',')[1]); }
      catch { Swal.fire({ icon: 'error', title: 'Compression failed', text: 'Could not compress the image.', customClass: { popup: 'premium-swal-popup' } }); e.target.value = ''; }
      return;
    }
    if (type === 'video' && sizeInMB > 1) {
      Swal.fire({ icon: 'error', title: 'Video too large', text: 'Video must be under 1MB.', customClass: { popup: 'premium-swal-popup' } });
      e.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setBase64(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  if (!exercise) return null;

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid var(--c-border)',
    borderRadius: 'var(--r-sm)', fontSize: '14px', fontWeight: 700,
    color: 'var(--c-text)', background: 'var(--c-surface-2)', outline: 'none',
    transition: 'border-color 0.2s',
  };
  const labelStyle = {
    fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px',
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="md" backdrop="static"  >
      {/* Header */}
      <CModalHeader className='premium-swal-popup' style={{ border: 'none', padding: '20px 22px 10px', background: 'var(--c-surface)' }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--c-text)' }}>
          <div className="app-icon-box app-icon-orange" style={{ width: '40px', height: '40px', borderRadius: '11px' }}>
            <Activity size={20} />
          </div>
          Activity Log
        </CModalTitle>
      </CModalHeader>



      <CModalBody style={{ padding: '4px 22px 20px', background: 'var(--c-surface-2)' }}>

        {/* Exercise name strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 14px', borderRadius: 'var(--r-sm)',
          background: 'var(--c-navy-xlight)', border: '1px solid var(--c-navy-light)',
          marginBottom: '16px',
        }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0 }}>
            <Dumbbell size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--c-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exercise.exerciseName || exercise.programName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--c-text-3)', fontWeight: 600 }}>Record your performance for today</div>
          </div>
        </div>

        {/* Sets & Reps */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          {[
            { label: `Sets (Goal: ${exercise.noOfSets || '3'})`, value: setsDone, onChange: setSetsDone, icon: <TrendingUp size={15} color="var(--c-navy)" /> },
            { label: `Reps (Goal: ${exercise.noOfRepetitions || '10'})`, value: repsDone, onChange: setRepsDone, icon: <Activity size={15} color="var(--c-navy)" /> },
          ].map((f, i) => (
            <div key={i} style={{ flex: 1 }}>
              <label style={labelStyle}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>{f.icon}</span>
                <input
                  type="number"
                  value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '34px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--c-navy)'}
                  onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Completion toggle */}
        <div
          onClick={() => setCompleted(!completed)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
            background: completed ? 'var(--c-success-light)' : 'var(--c-surface-2)',
            border: `1.5px solid ${completed ? 'var(--c-success)' : 'var(--c-border)'}`,
            transition: 'all 0.2s', marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: completed ? 'var(--c-success)' : 'var(--c-surface)', border: `2px solid ${completed ? 'var(--c-success)' : 'var(--c-border)'}`,
              transition: 'all 0.2s',
            }}>
              {completed && <CheckCircle2 size={16} color="#fff" />}
            </div>
            <span style={{ fontWeight: 700, fontSize: '13px', color: completed ? 'var(--c-success)' : 'var(--c-text)' }}>
              I've completed this session
            </span>
          </div>
          <CFormCheck id="completionCheck" className="m-0" checked={completed} readOnly />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Observations (Optional)</label>
          <textarea
            rows={2}
            placeholder="How did you feel? Any pain areas?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: 'none', fontWeight: 400 }}
            onFocus={e => e.target.style.borderColor = 'var(--c-navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
          />
        </div>

        {/* File Uploads */}
        <CRow className="g-2">
          {[
            { title: 'Before Session', color: 'app-icon-navy', titleColor: 'var(--c-navy)', keys: [{ key: 'beforeImage', type: 'image', label: 'Image', accept: 'image/*' }, { key: 'beforeVideo', type: 'video', label: 'Video', accept: 'video/*' }] },
            { title: 'After Session', color: 'app-icon-green', titleColor: 'var(--c-success)', keys: [{ key: 'afterImage', type: 'image', label: 'Image', accept: 'image/*' }, { key: 'afterVideo', type: 'video', label: 'Video', accept: 'video/*' }] },
          ].map((section, si) => (
            <CCol md={6} key={si}>
              <div style={{ padding: '12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border)', background: 'var(--c-surface)', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div className={`app-icon-box ${section.color}`} style={{ width: '28px', height: '28px', borderRadius: '7px' }}>
                    <ImageIcon size={13} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', color: section.titleColor }}>{section.title}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.keys.map(f => (
                    <div key={f.key}>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>{f.label}</label>
                      <input type="file" accept={f.accept} className="form-control form-control-sm" onChange={e => handleFileChange(e, f.key, f.type)} />
                    </div>
                  ))}
                </div>
              </div>
            </CCol>
          ))}
        </CRow>
      </CModalBody>

      <CModalFooter style={{ border: 'none', padding: '10px 22px 20px', background: 'var(--c-surface)' }}>
        <button
          className="app-btn-navy w-100"
          style={{ justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '12px' }}
          onClick={() => onSave({ exercise, setsDone: setsDone || '0', repsDone: repsDone || '0', notes, completed, beforeImage, afterImage, beforeVideo, afterVideo })}
        >
          {saving ? <CSpinner size="sm" /> : 'Save Activity Log'}
        </button>
      </CModalFooter>
    </CModal>
  );
};

/* ── View Progress Modal ─────────────────────────────────────── */
const ViewProgressModal = ({ record, visible, onClose, onPreview }) => {
  if (!record) return null;

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg" backdrop="static">
      <CModalHeader style={{ border: 'none', padding: '20px 22px 10px', background: 'var(--c-surface)' }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--c-text)' }}>
          <div className="app-icon-box app-icon-navy" style={{ width: '40px', height: '40px', borderRadius: '11px' }}>
            <TrendingUp size={20} />
          </div>
          Exercise Progress History
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '4px 22px 20px', background: 'var(--c-surface-2)' }}>
        {/* Summary strip */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px', borderRadius: 'var(--r-sm)',
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--c-text)' }}>
              {record.name ? `${record.name}'s Routine` : 'Exercise Routine'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--c-text-3)', fontWeight: 500, marginTop: '2px' }}>Logged sessions and observations</div>
          </div>
          <span style={{
            background: String(record.status || '').toLowerCase() === 'completed' ? 'var(--c-success-light)' : 'var(--c-navy-xlight)',
            color: String(record.status || '').toLowerCase() === 'completed' ? 'var(--c-success)' : 'var(--c-navy)',
            borderRadius: 'var(--r-pill)', padding: '5px 14px', fontSize: '11px', fontWeight: 800,
          }}>
            {record.status || 'Unknown'}
          </span>
        </div>

        {/* Timeline */}
        <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
          {record.therapyrecord?.map((session, index) => (
            <div key={index} className="app-card" style={{ marginBottom: '10px' }}>
              {/* Session header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '8px',
                padding: '12px 14px', borderBottom: '1px solid var(--c-border-light)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '7px',
                    background: 'var(--g-navy-soft)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 800,
                  }}>
                    {session.sessioncount}
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--c-text)' }}>
                    Session {session.sessioncount} of {session.session}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--c-text-3)', fontWeight: 600 }}>
                  <Calendar size={12} color="var(--c-navy)" /> {session.date}
                </span>
              </div>

              {/* Session body */}
              <div style={{ padding: '12px 14px' }}>
                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: '12px', flexWrap: 'wrap',
                  background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)',
                  padding: '10px 12px', marginBottom: '10px',
                  border: '1px solid var(--c-border-light)',
                }}>
                  {[
                    { label: 'Sets Done', val: session.setsdone, color: 'var(--c-navy)' },
                    { label: 'Reps Done', val: session.repitationdone ?? 0, color: 'var(--c-info)' },
                    { label: 'Completed', val: session.sessioncompleted ? 'Yes' : 'No', color: session.sessioncompleted ? 'var(--c-success)' : 'var(--c-danger)' },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: '1 1 80px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {session.notes && (
                  <div style={{
                    fontSize: '12px', color: 'var(--c-text-2)', padding: '9px 12px',
                    background: 'var(--c-surface)', borderRadius: 'var(--r-xs)',
                    border: '1px solid var(--c-border-light)', marginBottom: '10px', lineHeight: '1.5',
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>Notes: </span>{session.notes}
                  </div>
                )}

                {/* Media */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(() => {
                    const ensureBase64Prefix = (str, type) => {
                      if (!str || str === "null") return null;
                      if (str.startsWith('data:') || str.startsWith('http')) return str;
                      return `data:${type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${str}`;
                    };
                    const mediaItems = [
                      { key: 'beforeImage', label: 'Before Img', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
                      { key: 'afterImage', label: 'After Img', type: 'image', icon: ImageIcon, colorClass: 'app-icon-navy' },
                      { key: 'beforeVideo', label: 'Before Vid', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
                      { key: 'afterVideo', label: 'After Vid', type: 'video', icon: Video, colorClass: 'app-icon-sky' },
                    ];
                    return mediaItems.map(m => {
                      const data = session[m.key];
                      if (!data || data === "null") return null;
                      const fullUrl = ensureBase64Prefix(data, m.type);
                      return (
                        <button
                          key={m.key}
                          className="app-btn-outline-navy"
                          onClick={() => onPreview(fullUrl, m.type)}
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', gap: '5px' }}
                        >
                          <m.icon size={12} /> {m.label}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CModalBody>

      <CModalFooter style={{ border: 'none', padding: '10px 22px 18px', background: 'var(--c-surface)' }}>
        <button
          className="app-btn-outline-navy w-100"
          style={{ justifyContent: 'center', padding: '11px', fontSize: '13px', borderRadius: '10px' }}
          onClick={onClose}
        >
          Close History
        </button>
      </CModalFooter>
    </CModal>
  );
};

/* ── Main Page ───────────────────────────────────────────────── */
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
          const response = await physiotherapyService.getVisitHistory({ doctorId: queryParams.doctorId || '', patientId: pid, bookingId: id, clinicId: queryParams.clinicId || '', branchId: queryParams.branchId || '' });
          const resData = response.data;
          const history = resData ? (Array.isArray(resData) ? resData : [resData]) : [];
          visit = queryParams.therapistRecordId ? history.find(v => v.physiotherapyDoctorData?.therapistRecordId === queryParams.therapistRecordId) : history[0];
        }
        if (!visit) return;
        const physioData = visit.physiotherapyDoctorData;
        const resolvedDoctorId = physioData?.treatmentPlan?.doctorId || queryParams.doctorId || "";
        if (resolvedDoctorId) setDoctorId(resolvedDoctorId);
        const resolvedPatientName = physioData?.patientInfo?.patientName || "";
        if (resolvedPatientName) setPatientName(resolvedPatientName);
        const resolvedClinicId = queryParams.clinicId || physioData?.clinicId || "";
        const resolvedBranchId = queryParams.branchId || physioData?.branchId || "";
        const homeExercisePlan = physioData?.exercisePlan?.homeExercises || [];
        const therapyPrograms = physioData?.therapySessions?.[0]?.programs || [];
        let allExercises = [];
        if (homeExercisePlan.length > 0) {
          allExercises = homeExercisePlan.map(ex => ({ ...ex, exerciseName: ex.name, noOfSets: ex.sets, noOfRepetitions: ex.reps, instructions: ex.instructions, youtubeUrl: ex.videoUrl }));
        } else { allExercises = therapyPrograms; }
        setExercises(allExercises);
        const recordsMap = {};
        if (resolvedClinicId && resolvedBranchId) {
          await Promise.all(allExercises.map(async (ex) => {
            const exId = (ex.id && ex.id.trim()) || ex.exerciseId || ex.programId || ex.therapyExercisesId || (ex.name ? ex.name.trim().replace(/\s+/g, '_').toUpperCase() : '');
            if (exId) {
              try {
                const record = await localPhysiotherapyService.getByClinicBranchExercise(resolvedClinicId, resolvedBranchId, queryParams.therapistRecordId || "", pid || "", exId);
                if (record && record.success !== false) { recordsMap[exId] = Array.isArray(record.data) ? record.data[0] : (record.data || record); }
              } catch (err) { console.warn(`No existing therapy record for exercise ${exId}:`, err); }
            }
          }));
        }
        setTherapyRecords(recordsMap);
      } catch (error) { console.error('Error fetching home exercises:', error); }
      finally { setLoading(false); }
    };
    fetchExercises();
  }, [id, queryParams.patientId, queryParams.therapistRecordId, queryParams.clinicId, queryParams.branchId, queryParams.doctorId]);

  const handleTrack = (exercise) => { setSelectedExercise(exercise); setModalVisible(true); };
  const handlePreview = (url, type) => setPreviewData({ visible: true, url, type });

  const handleSave = async (data) => {
    console.log("data", data);
    try {
      setSaving(true);
      const exerciseId = (data.exercise.exerciseId && data.exercise.exerciseId.trim()) || data.exercise.exerciseId || data.exercise.programId || data.exercise.therapyExercisesId || (data.exercise.name ? data.exercise.name.trim().replace(/\s+/g, '_').toUpperCase() : '') || "";
      const existingRecord = therapyRecords[exerciseId];
      const totalSessions = parseInt(data.exercise.session || data.exercise.noOfSessions || data.exercise.sessions || 10, 10);
      const sessionCountDone = existingRecord ? (existingRecord.therapyrecord?.length || 0) + 1 : 1;
      const remainingSessions = Math.max(0, totalSessions - sessionCountDone);
      const newSession = { setsdone: parseInt(data.setsDone, 10) || 0, repitationdone: parseInt(data.repsDone, 10) || 0, sessioncount: sessionCountDone, session: totalSessions, sessioncompleted: data.completed, date: new Date().toISOString().split('T')[0], excerciseId: exerciseId, notes: data.notes || "", beforeImage: data.beforeImage || "", afterImage: data.afterImage || "", beforeVideo: data.beforeVideo || "", afterVideo: data.afterVideo || "" };
      const isStatusCompleted = sessionCountDone >= totalSessions;
      let updatedRecord;
      if (existingRecord) {
        const updatedSessions = [...(existingRecord.therapyrecord || []), newSession];
        updatedRecord = { ...existingRecord, therapyrecordid: queryParams.therapistRecordId || "", clincinid: queryParams.clinicId || "", brnchid: queryParams.branchId || "", patientid: patientId || "", doctorid: doctorId || "", name: patientName || "", status: isStatusCompleted ? "COMPLETED" : "ACTIVE", excerciseId: exerciseId, therapyrecord: updatedSessions };
      } else {
        updatedRecord = { therapyrecordid: queryParams.therapistRecordId || "", clincinid: queryParams.clinicId || "", brnchid: queryParams.branchId || "", patientid: patientId || "", doctorid: doctorId || "", name: patientName || "", status: isStatusCompleted ? "COMPLETED" : "ACTIVE", excerciseId: exerciseId, therapyrecord: [newSession] };
      }
      console.log("========== THERAPY RECORD PAYLOAD =========="); console.log("Existing Record Found:", !!existingRecord); console.log("Exercise ID:", exerciseId); console.log("Total Sessions Expected:", totalSessions); console.log("Current Session Count:", sessionCountDone); console.log("Full Payload to Send:", JSON.stringify(updatedRecord, null, 2)); console.log("=========================================");
      let response;
      if (existingRecord) { const recordId = queryParams.therapistRecordId; console.log("Updating existing record with ID:", recordId, "exercise:", exerciseId); console.log("PUT Endpoint: /api/customer/therapy-records/update/" + recordId + "/" + exerciseId); response = await localPhysiotherapyService.updateTherapyRecord(recordId, exerciseId, updatedRecord); console.log("Update Response:", response); }
      else { console.log("Creating new therapy record"); console.log("POST Endpoint: /api/customer/therapy-records/create"); response = await localPhysiotherapyService.createTherapyRecord(updatedRecord); console.log("Create Response:", response); }
      try {
        const freshRecord = await localPhysiotherapyService.getByClinicBranchExercise(queryParams.clinicId || "", queryParams.branchId || "", queryParams.therapistRecordId || "", patientId || "", exerciseId);
        if (freshRecord && freshRecord.success !== false) { console.log("Fresh record after save:", freshRecord); setTherapyRecords(prev => ({ ...prev, [exerciseId]: Array.isArray(freshRecord.data) ? freshRecord.data[0] : (freshRecord.data || freshRecord) })); }
      } catch (err) { console.error("Error re-fetching therapy record after save:", err); }
      setModalVisible(false);
      Swal.fire({ icon: 'success', title: 'Activity Logged!', text: 'Great job! Your progress has been shared with your therapist.', timer: 2500, showConfirmButton: false, background: '#fff', customClass: { popup: 'premium-swal-popup' } });
    } catch (error) {
      console.error("========== SAVE ERROR =========="); console.error("Error Message:", error.message); console.error("Error Status:", error.response?.status); console.error("Error Data:", error.response?.data); console.error("Full Error:", error); console.error("===============================");
      setModalVisible(false);
      Swal.fire({ icon: 'error', title: 'Error Logging Progress', text: error.response?.data?.message || 'There was an issue saving your progress. Please try again.', timer: 3000, showConfirmButton: true });
    } finally { setSaving(false); }
  };

  const handleViewProgress = async (item, exerciseId) => {
    setViewingProgressId(exerciseId);
    try {
      const res = await localPhysiotherapyService.getByClinicBranchExercise(queryParams.clinicId || '', queryParams.branchId || '', queryParams.therapistRecordId || '', queryParams.patientId || '', exerciseId);
      const freshRecord = (res && res.success !== false) ? (Array.isArray(res.data) ? res.data[0] : (res.data || res)) : (therapyRecords[exerciseId] || null);
      setSelectedRecord(freshRecord); setViewModalVisible(true);
    } catch (err) { console.error('Error fetching progress record:', err); setSelectedRecord(therapyRecords[exerciseId] || null); setViewModalVisible(true); }
    finally { setViewingProgressId(null); }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-ring" />
        <span className="app-loading-text">Fetching Your Routine…</span>
      </div>
    );
  }

  return (
    <motion.div className="app-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back to Visit History
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="app-hero-title">Home Exercises</h2>
              <p className="app-hero-sub">Achieve faster recovery by staying consistent at home</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(249,115,22,0.22)', border: '1px solid rgba(249,115,22,0.35)',
                color: '#fdba74', borderRadius: 'var(--r-pill)', padding: '5px 14px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
              }}>
                Daily Program
              </span>
              {exercises.length > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff', borderRadius: 'var(--r-pill)', padding: '5px 14px',
                  fontSize: '11px', fontWeight: 700,
                }}>
                  {exercises.length} Exercise{exercises.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="app-body" style={{ marginTop: '-32px' }}>
        <CRow className="g-3">
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
              <motion.div className="app-empty" style={{ padding: '72px 24px' }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Home size={64} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--c-text)', margin: '0 0 6px' }}>No Home Exercises Found</p>
                <p style={{ fontSize: '13px', margin: 0, maxWidth: '360px' }}>Your therapist hasn't assigned any home routines for this visit yet.</p>
              </motion.div>
            </CCol>
          )}
        </CRow>
      </div>

      <TrackingModal exercise={selectedExercise} visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleSave} saving={saving} />
      <ViewProgressModal record={selectedRecord} visible={viewModalVisible} onClose={() => setViewModalVisible(false)} onPreview={handlePreview} />
      <MediaPreviewModal visible={previewData.visible} onClose={() => setPreviewData({ ...previewData, visible: false })} mediaUrl={previewData.url} type={previewData.type} />
    </motion.div>
  );
};

export default HomeExercises;