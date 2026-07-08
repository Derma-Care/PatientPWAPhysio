import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import { toast } from '../utils/toast';

import {
  Calendar, Clock, User, MapPin, Stethoscope,
  ChevronRight, ChevronLeft, CheckCircle, Loader, Heart, Sun, Sunset
} from 'lucide-react';
import BodyAssessment from '../components/BodyAssessment';
import '../styles/theme.css';
import '../styles/BookappointmentResponsive.css';
import { uploadFile } from './S3UploadService';
import imageCompression from 'browser-image-compression';



const ACTIVITY_OPTIONS = ['Sedentary', 'Moderate', 'Active', 'Athlete'];
const REASON_OPTIONS = ['Chronic Pain', 'Sports Rehab', 'Neuro Rehab', 'Others'];

const getRawImageMimeType = (value = '') => {
  if (value.startsWith('iVBOR')) return 'image/png';
  if (value.startsWith('/9j/')) return 'image/jpeg';
  if (value.startsWith('R0lGOD')) return 'image/gif';
  if (value.startsWith('UklGR')) return 'image/webp';
  return '';
};

const isRawImageBase64 = (value) =>
  typeof value === 'string' && Boolean(getRawImageMimeType(value.trim()));

const getPainAssessmentImageSrc = (value) => {
  if (typeof value !== 'string') return '';
  const image = value.trim();
  if (!image) return '';
  if (image.startsWith('data:image') || image.startsWith('http') || image.startsWith('blob:')) return image;

  const mimeType = getRawImageMimeType(image);
  if (mimeType) return `data:${mimeType};base64,${image}`;

  return '';
};

const base64ToFile = (base64String, filename = 'pain_assessment.png') => {
  try {
    const raw = base64String.includes(',') ? base64String.split(',').pop() : base64String;
    const mime = base64String.match(/data:(.*?);base64/)?.[1] || getRawImageMimeType(raw) || 'image/png';
    const bstr = atob(raw);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i += 1) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('base64ToFile conversion failed', error);
    return null;
  }
};
const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hospital = JSON.parse(localStorage.getItem('selectedHospital') || '{}');
  const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
  const hospitalId = hospital.hospitalId;
  const doctorSectionRef = React.useRef(null);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Visit Type
  const [visitType, setVisitType] = useState('first'); // 'first' or 'followup'

  // Step 0: Branch & Doctor
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Step 1: Select Slot
  const [slots, setSlots] = useState([]);
  const [dateMap, setDateMap] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 2 (First Visit only): Lifestyle & Pain Assessment
  const [occupation, setOccupation] = useState('');
  const [activityLevels, setActivityLevels] = useState([]);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [symptomsDuration, setSymptomsDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('Days');

  const [previousInjuries, setPreviousInjuries] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Pain Assessment state
  const [part, setPart] = useState([]);
  const [partImage, setPartImage] = useState('');
  const [theraphyQuestions, setTheraphyQuestions] = useState({});
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  // Step 3 / Step 2 (Follow-up): Confirm
  const [problem, setProblem] = useState('');
  const [paymentType, setPaymentType] = useState('Not Paid');

  // Dynamic steps
  const steps = visitType === 'followup'
    ? ['Branch & Doctor', 'Select Slot', 'Confirm']
    : ['Branch & Doctor', 'Select Slot', 'Lifestyle & Assessment', 'Confirm'];

  /* ── fetch branches ─────────────────────────────────────── */
  useEffect(() => {
    if (!hospitalId) return;
    setLoadingBranches(true);
    bookingService.getBranches(hospitalId)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        setBranches(list);
      })
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [hospitalId]);

  /* ── fetch doctors when branch selected ─────────────────── */
  useEffect(() => {
    if (!selectedBranch) return;
    setLoadingDoctors(true);
    setDoctors([]); setSelectedDoctor(null);
    bookingService.getDoctorsByBranch(hospitalId, selectedBranch.branchId)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        setDoctors(list);
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [selectedBranch]);

  /* ── fetch slots when doctor selected ───────────────────── */
  const fetchSlots = async (doctor) => {
    if (!selectedBranch) return;
    setLoadingSlots(true);
    setSlots([]); setDateMap({}); setSelectedDate(''); setSelectedSlot('');
    try {
      const res = await bookingService.getSlots(hospitalId, selectedBranch.branchId, doctor.doctorId);

      let raw = [];
      if (Array.isArray(res)) {
        raw = res;
      } else if (res && Array.isArray(res.data)) {
        raw = res.data;
      } else if (res && res.success && Array.isArray(res.data)) {
        raw = res.data;
      }

      setSlots(raw);

      const map = {};
      raw.forEach(dateObj => {
        const d = dateObj.date || dateObj.day || dateObj.serviceDate || '';
        if (!d) return;
        let slots = Array.isArray(dateObj.availableSlots) ? dateObj.availableSlots : [];
        slots = slots.filter(s => s.reason !== 'Time already passed');
        map[d] = slots;
      });

      setDateMap(map);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allDates = Object.keys(map);
      const future = allDates
        .filter(d => {
          const dt = new Date(d);
          return !isNaN(dt) && dt >= today;
        })
        .sort();

      if (future.length) setSelectedDate(future[0]);
      else if (allDates.length) setSelectedDate(allDates[0]); // fallback: show all dates

    } catch (err) {
      console.error('[BookAppointment] Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }

  };

  const handlePartClick = (data) => {
    let actualData = data;
    if (Array.isArray(data.answerData)) {
      actualData = data.answerData[data.answerData.length - 1];
    }
    setPart(actualData.parts || []);
    setPartImage(data.image || '');
    setTheraphyQuestions(actualData.answerData || {});
  };

  /* ── navigation ─────────────────────────────────────────── */
  const goNext = () => {
    if (step === 0) {
      if (!selectedBranch || !selectedDoctor) {
        toast.error('Required', 'Please select a branch and doctor.');
        return;
      }
    }
    if (step === 1) {
      if (!selectedSlot) {
        toast.error('Required', 'Please select a time slot.');
        return;
      }
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true);
    setUploadProgressMsg('');

    try {
      const combinedDuration = symptomsDuration && durationUnit
        ? `${symptomsDuration} ${durationUnit}`
        : symptomsDuration;


      let partImageFileKey = partImage;
      if (visitType === 'first' && (partImage?.startsWith('data:image') || isRawImageBase64(partImage))) {
        setUploadProgressMsg('Uploading pain assessment image...');
        const file = base64ToFile(partImage);
        if (!file) {
          throw new Error('Could not prepare pain assessment image for upload.');
        }
        partImageFileKey = await uploadFile('partImage', file);
      }

      let uploadedAttachments = [];
      if (visitType === 'first' && attachments?.length > 0) {
        setUploadProgressMsg('Compressing & uploading attachments...');
        for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
          if (att.isS3) {
            uploadedAttachments.push(att.url);
          } else if (att.fileObj) {
            try {
              let f = att.fileObj;
              if (f.type.startsWith('image/')) {
                const options = { maxSizeMB: 0.14, maxWidthOrHeight: 1280, useWebWorker: true, fileType: f.type };
                const compressedBlob = await imageCompression(f, options);
                const ext = f.type.split('/').pop() || 'jpeg';
                f = new File([compressedBlob], att.name.replace(/\.[^/.]+$/, "") + "." + ext, {
                  type: f.type,
                  lastModified: Date.now()
                });
              }
              const key = await uploadFile('attachment', f);
              uploadedAttachments.push(key);
            } catch (err) {
              console.error("Failed to upload attachment:", err);
              throw new Error(`Failed to upload attachment: ${att.name}`);
            }
          }
        }
      }

      const payload = {
        clinicId: hospitalId,
        clinicName: hospital?.name || '',
        clinicAddress: hospital?.address || '',
        branchId: selectedBranch.branchId,
        branchname: selectedBranch.branchName,
        doctorId: selectedDoctor.doctorId,
        doctorName: selectedDoctor.doctorName,
        doctorDeviceId: selectedDoctor?.deviceId || '',
        doctorRefCode: selectedDoctor?.doctorRefCode || '',
        title: profile?.title || '',
        customerId: profile.customerId || '',
        patientId: profile.patientId || '',
        name: profile.fullName || user.name || '',
        mobileNumber: profile.mobileNumber || '',
        patientMobileNumber: profile.mobileNumber || '',
        email: profile.email || '',
        gender: profile.gender || '',
        age: profile.age || '',
        dob: profile.dateOfBirth || '',
        dateOfBirth: profile.dateOfBirth || '',
        bookingFor: 'Self',
        address: {
          houseNo: profile.address?.houseNo || '',
          street: profile.address?.street || '',
          landmark: profile.address?.landmark || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          postalCode: profile.address?.postalCode || '',
          country: profile.address?.country || 'India',
        },
        patientAddress: [
          profile.address?.houseNo,
          profile.address?.street,
          profile.address?.landmark,
          profile.address?.city,
          profile.address?.state,
          profile.address?.postalCode
        ].filter(Boolean).join(', '),
        serviceDate: selectedDate,
        servicetime: selectedSlot,
        consultationExpiration: hospital?.consultationExpiration || '',
        problem,
        paymentType,
        partAmount: '',
        servicecost: '',
        focReason: '',
        customerDeviceId: profile?.deviceId || '',
        referredByType: '',
        referredByName: '',
        freeFollowUps: hospital?.freeFollowUps || '',
        visitType,
        consultationType: 'Services & Treatments',
        foc: 'Paid',
        consultationFee: selectedDoctor.doctorFees?.inClinicFee || 0,
        listOfConsultationFee: [{ consulationFee: Number(selectedDoctor.doctorFees?.inClinicFee || 0) }],
      };

      // Add Lifestyle and Pain Assessment if it's a first visit
      if (visitType === 'first') {
        payload.occupation = occupation;
        payload.activityLevels = activityLevels;
        payload.reasonForVisit = reasonForVisit === 'Others' ? otherReason : reasonForVisit;
        payload.reasonforVisit = payload.reasonForVisit; // Fallback for case sensitivity
        payload.symptomsDuration = combinedDuration;
        payload.unit = durationUnit; // Adding separate unit field as requested
        payload.previousInjuries = previousInjuries;
        payload.currentMedications = currentMedications;
        payload.allergies = allergies;
        payload.parts = part;
        payload.partImage = partImageFileKey;
        payload.theraphyAnswers = theraphyQuestions;
        payload.insuranceProvider = insuranceProvider;
        payload.policyNumber = policyNumber;
        payload.attachments = uploadedAttachments;
      }

      await bookingService.postBooking(payload);
      toast.success('Booked!', 'Your appointment has been confirmed.');
      navigate('/bookings');
    } catch (err) {
      console.error("Booking submission error:", err);
      const msg = err?.response?.data?.message || 'Booking failed. Please try again.';
      toast.error('Error', msg);
    } finally {
      setSubmitting(false);
      setUploadProgressMsg('');
    }
  };

  const formatDateParts = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return { weekday: '', day: d, month: '' };
    return {
      weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: dt.toLocaleDateString('en-US', { day: 'numeric' }),
      month: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    };
  };

  const formatDateLabel = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ALL slots for selected date (no filtering — show both available and booked)
  const rawSlots = dateMap[selectedDate] || [];
  const isBooked = (s) => s.slotbooked === true || s.slotbooked === 'true';
  
  const getFilteredSlots = () => {
    if (!selectedDate || !rawSlots) return [];
    
    const localDateObj = new Date(selectedDate.includes('-') ? selectedDate.replace(/-/g, '/') : selectedDate);
    localDateObj.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = localDateObj.getTime() === today.getTime();
    
    const now = new Date();

    return rawSlots.filter(s => {
      if (!isToday) return true;
      
      const timeStr = (s.slot || '').toUpperCase();
      let modifier = '';
      let time = timeStr;
      
      if (timeStr.includes('AM')) { modifier = 'AM'; time = timeStr.replace('AM', '').trim(); }
      else if (timeStr.includes('PM')) { modifier = 'PM'; time = timeStr.replace('PM', '').trim(); }
      
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10) || 0;
      minutes = parseInt(minutes, 10) || 0;
      
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      
      return slotTime > now;
    });
  };

  const slotsForDate = getFilteredSlots();

  // Categorize slots into Morning and Afternoon/Evening
  const getCategorizedSlots = () => {
    const morning = [];
    const afternoon = [];
    slotsForDate.forEach(s => {
      const timeStr = (s.slot || '').toUpperCase();
      const isPm = timeStr.includes('PM');
      const hour = parseInt((s.slot || '').split(':')[0], 10);

      if (isPm || (!timeStr.includes('AM') && hour >= 12)) {
        afternoon.push(s);
      } else {
        morning.push(s);
      }
    });
    return { morning, afternoon };
  };

  const { morning: morningSlots, afternoon: afternoonSlots } = getCategorizedSlots();

  return (
    <div className="app-page ba-page">
      {/* Hero */}
      <div className="app-hero">
        <div className="app-hero-inner ba-hero-inner">
          <button className="app-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={15} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(249,115,22,.25)', border: '1px solid rgba(249,115,22,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={18} color="#fdba74" />
            </div>
            <div>
              <h2 className="app-hero-title" style={{ margin: 0 }}>Book Appointment</h2>
              <p className="app-hero-sub">Get scheduled in minutes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="app-body ba-body" style={{ marginTop: '-32px' }}>
        {/* Stepper */}
        <div className="ba-stepper">
          {steps.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className="ba-step-dot" style={{
                  background: i < step ? 'var(--c-success)' : i === step ? 'var(--g-navy-soft)' : 'var(--c-surface-3)',
                  color: i <= step ? '#fff' : 'var(--c-text-3)',
                }}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className="ba-step-label" style={{ color: i === step ? 'var(--c-navy)' : 'var(--c-text-3)' }}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="ba-step-connector" style={{
                  background: i < step ? 'var(--c-success)' : 'var(--c-border)',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ══ STEP 0: Visit Type & Branch & Doctor ══ */}
        {step === 0 && (
          <div className="app-card animate-fade-in">
            <div className="app-card-body">
              {/* Visit Type */}
              <p className="ba-section-title">
                <Heart size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Visit Type
              </p>
              <div className="ba-visit-type-row">
                <button
                  type="button"
                  onClick={() => setVisitType('first')}
                  className={`ba-visit-type-btn ${visitType === 'first' ? 'is-active' : ''}`}
                >
                  New Visit
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/follow-up-booking')}
                  className="ba-visit-type-btn"
                >
                  Follow-up Visit
                </button>
              </div>

              {/* Branch + Doctor side by side on desktop */}
              <div className="ba-branch-doctor-grid">
                <div>
                  <p className="ba-section-title">
                    <MapPin size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Select Branch
                  </p>
                  {loadingBranches ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--c-text-3)' }}>
                      <Loader size={20} className="spin" />
                    </div>
                  ) : branches.length === 0 ? (
                    <p style={{ color: 'var(--c-text-3)', fontSize: 13 }}>No branches available.</p>
                  ) : (
                    <div className="ba-option-list">
                      {branches.map((b) => {
                        const sel = selectedBranch?.branchId === b.branchId;
                        return (
                          <button key={b.branchId} onClick={() => {
                              setSelectedBranch(b);
                              setTimeout(() => doctorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                            }}
                            className={`ba-option-btn ${sel ? 'is-selected' : ''}`}>
                            <div className="app-icon-box app-icon-navy" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                              <MapPin size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{b.branchName}</div>
                              {b.address && <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{b.address}</div>}
                            </div>
                            {sel && <CheckCircle size={18} color="var(--c-navy)" style={{ marginLeft: 'auto' }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Doctor */}
                {selectedBranch && (
                  <div ref={doctorSectionRef}>
                    <p className="ba-section-title">
                      <Stethoscope size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Select Doctor
                    </p>
                    {loadingDoctors ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--c-text-3)' }}>
                        <Loader size={20} className="spin" />
                      </div>
                    ) : doctors.length === 0 ? (
                      <p style={{ color: 'var(--c-text-3)', fontSize: 13 }}>No doctors available for this branch.</p>
                    ) : (
                      <div className="ba-option-list">
                        {doctors.map((d) => {
                          const sel = selectedDoctor?.doctorId === d.doctorId;
                          const unavailable = d.doctorAvailabilityStatus === false;
                          return (
                            <button key={d.doctorId}
                              onClick={() => { setSelectedDoctor(d); fetchSlots(d); }}
                              className={`ba-option-btn ${sel ? 'is-selected' : ''} ${unavailable ? 'is-disabled' : ''}`}>
                              <div className="app-icon-box app-icon-navy" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                                <Stethoscope size={16} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{d.doctorName}</div>
                                <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>
                                  Fee: ₹{d.doctorFees?.inClinicFee || 0}
                                  {unavailable && ' · Not Available'}
                                </div>
                              </div>
                              {sel && <CheckCircle size={18} color="var(--c-navy)" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1: Select Slot ══ */}
        {step === 1 && (
          <div className="app-card animate-fade-in">
            <div className="app-card-body" style={{ padding: '20px 16px' }}>
              <p className="ba-section-title" style={{ marginBottom: 14 }}>
                <Calendar size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Select Date
              </p>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--c-text-3)' }}>
                  <Loader size={24} className="spin" />
                  <p style={{ marginTop: 12, fontSize: 13 }}>Loading available slots…</p>
                </div>
              ) : Object.keys(dateMap).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--c-text-3)', fontSize: 13 }}>
                  No available slot records found for this doctor.
                </div>
              ) : (
                <>
                  {/* Date strip */}
                  <div className="hide-scrollbar ba-date-strip">
                    {Object.keys(dateMap)
                      .filter(d => {
                        const localDateObj = new Date(d.includes('-') ? d.replace(/-/g, '/') : d);
                        localDateObj.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return localDateObj >= today;
                      })
                      .sort()
                      .map(d => {
                        const sel = selectedDate === d;
                        const parts = formatDateParts(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setSelectedDate(d); setSelectedSlot(''); setShowAllSlots(false); }}
                            className={`ba-date-chip ${sel ? 'is-selected' : ''}`}
                          >
                            <span style={{ fontSize: '9px', fontWeight: 700, opacity: sel ? 0.9 : 0.6, letterSpacing: '0.5px' }}>{parts.weekday}</span>
                            <span style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0', fontFamily: 'Sora' }}>{parts.day}</span>
                            <span style={{ fontSize: '9px', fontWeight: 700, opacity: sel ? 0.9 : 0.6 }}>{parts.month}</span>
                          </button>
                        );
                      })}
                  </div>

                  {selectedDate && (
                    <div style={{ borderTop: '1px solid var(--c-border-light)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text-2)', margin: 0 }}>
                          Available Times for {formatDateLabel(selectedDate)}
                        </p>
                      </div>

                      {slotsForDate.length === 0 ? (
                        <p style={{ color: 'var(--c-text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                          No free slots available for this date.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                          {/* MORNING SLOTS */}
                          {morningSlots.length > 0 && (
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Sun size={14} color="#f59e0b" /> Morning Slots
                              </p>
                              <div className="ba-slot-grid">
                                {morningSlots.slice(0, showAllSlots ? morningSlots.length : 6).map((s, i) => {
                                  const sel = selectedSlot === s.slot;
                                  const booked = isBooked(s);
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      disabled={booked}
                                      onClick={() => !booked && setSelectedSlot(s.slot)}
                                      title={booked ? 'This slot is already booked' : ''}
                                      className={`ba-slot-btn ${sel ? 'is-selected' : ''} ${booked ? 'is-booked' : ''}`}
                                    >
                                      {s.slot}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* AFTERNOON & EVENING SLOTS */}
                          {afternoonSlots.length > 0 && (
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Sunset size={14} color="#ea6800" /> Afternoon & Evening Slots
                              </p>
                              <div className="ba-slot-grid">
                                {afternoonSlots.slice(0, showAllSlots ? afternoonSlots.length : 6).map((s, i) => {
                                  const sel = selectedSlot === s.slot;
                                  const booked = isBooked(s);
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      disabled={booked}
                                      onClick={() => !booked && setSelectedSlot(s.slot)}
                                      title={booked ? 'This slot is already booked' : ''}
                                      className={`ba-slot-btn ${sel ? 'is-selected' : ''} ${booked ? 'is-booked' : ''}`}
                                    >
                                      {s.slot}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {(morningSlots.length > 6 || afternoonSlots.length > 6) && (
                            <button
                              type="button"
                              onClick={() => setShowAllSlots(!showAllSlots)}
                              style={{
                                width: '100%', padding: '10px', marginTop: '4px',
                                background: 'transparent', border: '1px dashed var(--c-navy)',
                                color: 'var(--c-navy)', borderRadius: 'var(--r-sm)',
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                transition: 'all .2s'
                              }}
                            >
                              {showAllSlots ? 'Show Less Slots' : 'Show More Slots'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected slot confirmation banner */}
                  {selectedSlot && (
                    <div style={{
                      marginTop: 18,
                      padding: '14px 16px',
                      background: 'var(--g-navy-soft)',
                      borderRadius: 'var(--r-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: 'var(--s-navy)',
                      animation: 'fadeInUp .3s ease forwards',
                    }}>
                      <CheckCircle size={20} color="#fff" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>Selected Appointment Slot</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                          {formatDateLabel(selectedDate)} &nbsp;·&nbsp; {selectedSlot}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 2: Lifestyle & Pain Assessment (First Visit Only) ══ */}
        {step === 2 && visitType === 'first' && (
          <div className="ba-step2-layout animate-fade-in">
            {/* Lifestyle & History Form */}
            <div className="app-card">
              <div className="app-card-body">
                <p className="ba-card-title">
                  Lifestyle & Medical History
                </p>

                <div className="ba-form-grid">
                  {/* Occupation */}
                  <div className="ba-field ba-field-full">
                    <label className="ba-label">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Software Engineer, Teacher"
                      className="ba-input"
                    />
                  </div>

                  {/* Activity Level */}
                  <div className="ba-field ba-field-full">
                    <label className="ba-label">
                      Activity Level
                    </label>
                    <div className="ba-choice-grid ba-choice-grid-4">
                      {ACTIVITY_OPTIONS.map((opt) => {
                        const isSel = activityLevels.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setActivityLevels(prev => prev.includes(opt) ? prev.filter(l => l !== opt) : [...prev, opt])}
                            className={`ba-choice-btn ${isSel ? 'is-selected' : ''}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  <div className="ba-field ba-field-full">
                    <label className="ba-label">
                      Reason for Visit
                    </label>
                    <div className="ba-choice-grid ba-choice-grid-4">
                      {REASON_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setReasonForVisit(opt)}
                          className={`ba-choice-btn ${reasonForVisit === opt ? 'is-selected' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {reasonForVisit === 'Others' && (
                      <input
                        type="text"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="Please specify..."
                        className="ba-input"
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>

                  {/* Symptoms Duration */}
                  <div className="ba-field">
                    <label className="ba-label">
                      Symptoms Duration
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        value={symptomsDuration}
                        onChange={(e) => setSymptomsDuration(e.target.value)}
                        placeholder="e.g. 3"
                        className="ba-input"
                        style={{ flex: 1 }}
                      />
                      <select
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value)}
                        className="ba-input"
                        style={{ width: 110, flexShrink: 0 }}
                      >
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>

                  {/* Previous Injuries */}
                  <div className="ba-field ba-field-full">
                    <label className="ba-label">
                      Previous Injuries / Surgeries
                    </label>
                    <textarea
                      value={previousInjuries}
                      onChange={(e) => setPreviousInjuries(e.target.value)}
                      placeholder="Details of past injuries, fractures, surgeries..."
                      rows={2}
                      className="ba-input ba-textarea"
                    />
                  </div>

                  <div className="ba-field">
                    <label className="ba-label">
                      Current Medications
                    </label>
                    <textarea
                      value={currentMedications}
                      onChange={(e) => setCurrentMedications(e.target.value)}
                      placeholder="List currently prescribed medicines or supplements..."
                      rows={2}
                      className="ba-input ba-textarea"
                    />
                  </div>

                  <div className="ba-field">
                    <label className="ba-label">
                      Allergies
                    </label>
                    <textarea
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="List drug, food, or chemical allergies..."
                      rows={2}
                      className="ba-input ba-textarea"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--c-border-light)', margin: '16px 0' }} />

                <p className="ba-card-title" style={{ border: 'none', paddingBottom: 0 }}>Insurance Info</p>
                <div className="ba-form-grid" style={{ marginTop: 10, marginBottom: 16 }}>
                  <div className="ba-field">
                    <label className="ba-label">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="ba-input"
                    />
                  </div>
                  <div className="ba-field">
                    <label className="ba-label">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="ba-input"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--c-border-light)', margin: '16px 0' }} />

                <p className="ba-card-title" style={{ border: 'none', paddingBottom: 0 }}>Previous Medical Records <span style={{ fontWeight: 400, color: 'var(--c-text-3)', fontSize: 12 }}>(Optional • PDF only • max 250 KB each • up to 6 files)</span></p>
                <div style={{ marginTop: 10, marginBottom: 16 }}>
                  {/* Drop zone */}
                  <label
                    htmlFor="med-records-upload"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '22px 16px', borderRadius: 'var(--r-md)',
                      border: '2px dashed var(--c-navy-light)', background: 'var(--c-navy-xlight)',
                      cursor: (attachments?.length || 0) >= 6 ? 'not-allowed' : 'pointer',
                      opacity: (attachments?.length || 0) >= 6 ? 0.5 : 1,
                      transition: 'all .2s',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>📂</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-navy)' }}>
                      {(attachments?.length || 0) >= 6 ? 'Maximum 6 files reached' : 'Click to upload PDF files'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>
                      {attachments?.length || 0} / 6 files uploaded
                    </span>
                  </label>
                  <input
                    id="med-records-upload"
                    type="file"
                    multiple
                    accept=".pdf"
                    style={{ display: 'none' }}
                    disabled={(attachments?.length || 0) >= 6}
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files);
                      const remaining = 6 - (attachments?.length || 0);
                      if (newFiles.length > remaining) {
                        toast.error('Limit Reached', `You can only add ${remaining} more file(s). Maximum 6 allowed.`);
                        e.target.value = '';
                        return;
                      }
                      const valid = [];
                      for (const file of newFiles) {
                        if (file.type !== 'application/pdf') {
                          toast.error('Invalid File', `"${file.name}" is not a PDF.`);
                          continue;
                        }
                        if (file.size > 250 * 1024) {
                          toast.error('File Too Large', `"${file.name}" exceeds 250 KB limit.`);
                          continue;
                        }
                        valid.push({ name: file.name, fileObj: file, isS3: false });
                      }
                      if (valid.length) setAttachments((p) => [...(p || []), ...valid]);
                      e.target.value = '';
                    }}
                  />

                  {/* File list */}
                  {attachments?.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {attachments.map((file, i) => {
                        const sizeKb = file.fileObj ? (file.fileObj.size / 1024).toFixed(1) : '—';
                        return (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 'var(--r-sm)',
                            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                            boxShadow: 'var(--s-xs)',
                          }}>
                            <span style={{ fontSize: 22, flexShrink: 0 }}>📄</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>
                                PDF • {sizeKb} KB
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}
                              style={{
                                background: 'var(--c-danger-light)', border: 'none', borderRadius: 6,
                                color: 'var(--c-danger)', fontWeight: 700, fontSize: 16,
                                width: 28, height: 28, cursor: 'pointer', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Pain Assessment Body Map */}
            <div className="app-card">
              <div className="app-card-body">
                <p className="ba-card-title">
                  Interactive Pain Assessment
                </p>
                <BodyAssessment
                  onPartClick={handlePartClick}
                  initialSelected={part}
                  initialAnswers={theraphyQuestions}
                  initialImage={partImage}
                />
                {partImage && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-success)', margin: '0 0 4px' }}>
                      ✓ Body Map Marked & Questionnaire Saved
                    </p>
                    <img
                      src={getPainAssessmentImageSrc(partImage)}
                      alt="Drawn Area Preview"
                      style={{
                        width: 140,
                        height: 140,
                        objectFit: 'contain',
                        borderRadius: 'var(--r-xs)',
                        border: '1px solid var(--c-border)',
                        background: '#fff'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3 / STEP 2: Confirm & Pay ══ */}
        {((step === 2 && visitType === 'followup') || (step === 3 && visitType === 'first')) && (
          <div className="app-card animate-fade-in">
            <div className="app-card-body">
              <p className="ba-card-title" style={{ border: 'none', paddingBottom: 0, marginBottom: 12 }}>Booking Summary</p>
              <div className="ba-summary-grid">
                {[
                  { label: 'Visit Type', value: visitType === 'followup' ? 'Follow-up Visit' : 'First Visit', Icon: Heart },
                  { label: 'Branch', value: selectedBranch?.branchName, Icon: MapPin },
                  { label: 'Doctor', value: selectedDoctor?.doctorName, Icon: Stethoscope },
                  { label: 'Date', value: formatDateLabel(selectedDate), Icon: Calendar },
                  { label: 'Time', value: selectedSlot, Icon: Clock },
                  { label: 'Patient', value: user?.customerName || user?.name, Icon: User },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="app-info-item" style={{ marginBottom: 8 }}>
                    <div className="app-icon-box app-icon-navy" style={{ width: 32, height: 32, borderRadius: 8 }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="app-info-label">{label}</div>
                      <div className="app-info-value">{value || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assessment summary if first visit */}
              {visitType === 'first' && part.length > 0 && (
                <div style={{
                  marginTop: 14, padding: '12px 14px', border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-sm)', background: 'var(--c-surface-2)'
                }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--c-navy)', margin: '0 0 6px' }}>Pain Locations Selected</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {part.map((p) => (
                      <span key={p} style={{
                        background: 'var(--c-navy-xlight)', color: 'var(--c-navy)',
                        fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--r-pill)'
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="ba-confirm-grid">
                {/* Problem description */}
                <div style={{ marginTop: 16 }}>
                  <label className="ba-label" style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)', marginBottom: 6 }}>
                    Describe Your Problem
                  </label>
                  <textarea
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    rows={3}
                    placeholder="Brief description of your current symptoms or reason for visit…"
                    className="ba-input ba-textarea"
                  />
                </div>

                {/* Payment Type */}
                <div style={{ marginTop: 14 }}>
                  <label className="ba-label" style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)', marginBottom: 8 }}>
                    Payment Method
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button"
                      style={{
                        padding: '10px 14px', borderRadius: 'var(--r-sm)',
                        border: '2px solid var(--c-navy)',
                        background: 'var(--c-navy-xlight)',
                        color: 'var(--c-navy)',
                        fontWeight: 700, fontSize: 13, cursor: 'default',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                      🚫 Not Paid
                    </button>
                  </div>
                  <p style={{ marginTop: 8, marginBottom: 0, fontSize: 11, color: 'var(--c-text-3)', fontStyle: 'italic' }}>
                    * You can pay at the hospital during your appointment.
                  </p>
                </div>
              </div>

              {/* Consultation Fee */}
              <div style={{
                marginTop: 16, padding: '12px 14px',
                background: 'var(--c-navy-xlight)', borderRadius: 'var(--r-sm)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)' }}>Consultation Fee</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--c-navy)' }}>
                  ₹{selectedDoctor?.doctorFees?.inClinicFee || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Nav */}
        <div className="ba-footer-nav">
          {step > 0 && (
            <button onClick={goPrev} className="ba-btn ba-btn-secondary">
              <ChevronLeft size={17} /> Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={goNext} className="ba-btn ba-btn-primary">
              Next <ChevronRight size={17} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className={`ba-btn ba-btn-primary ${submitting ? 'is-disabled' : ''}`}>
              {submitting ? <><Loader size={16} className="spin" /> {uploadProgressMsg || 'Confirming...'}</> : <>Confirm Booking</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;