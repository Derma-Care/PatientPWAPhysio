import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, customerService } from '../services/api';
import { toast } from '../utils/toast';
import {
  Calendar, Clock, User, MapPin, Stethoscope,
  ChevronRight, ChevronLeft, CheckCircle, Loader, Sun, Sunset, ArrowLeft
} from 'lucide-react';
import '../styles/theme.css';

/* ── Helpers ──────────────────────────────────────────────── */
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

/* ── Main Component ───────────────────────────────────────── */
const FollowUpBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hospital = JSON.parse(localStorage.getItem('selectedHospital') || '{}');
  const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
  const hospitalId = hospital.hospitalId;

  // Step: 0=select appointment, 1=select slot, 2=confirm
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFOC, setIsFOC] = useState(false); // free follow-up

  // Step 1: Slots
  const [slots, setSlots] = useState([]);
  const [dateMap, setDateMap] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Step 2: Confirm
  const [problem, setProblem] = useState('');

  /* ── Fetch completed appointments ────────────────────────── */
  useEffect(() => {
    if (!user?.customerId) return;
    setLoadingBookings(true);
    customerService.getBookings(user.customerId)
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        // Only allow specific active statuses for follow-up booking
        const allowedStatuses = ['in-progress', 'in progress', 'due for investigation', 'investigation done'];
        setCompletedBookings(all.filter(b => {
          const s = (b?.status || '').toLowerCase().trim();
          return allowedStatuses.includes(s);
        }));
      })
      .catch(() => setCompletedBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [user]);

  /* ── When appointment selected: check FOC & fetch slots ─── */
  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);

    // Check free follow-ups: if freeFollowUps remaining > 0 → FOC
    const freeFollowUps = Number(booking.freeFollowUps ?? hospital?.freeFollowUps ?? 0);
    const visitCount = Number(booking.visitCount ?? 1);
    const free = freeFollowUps > 0 && visitCount <= freeFollowUps;
    setIsFOC(free);

    // Fetch slots for same doctor + branch
    setLoadingSlots(true);
    setSlots([]); setDateMap({}); setSelectedDate(''); setSelectedSlot('');
    try {
      const res = await bookingService.getSlots(
        hospitalId,
        booking.branchId,
        booking.doctorId
      );
      
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
      else if (allDates.length) setSelectedDate(allDates[0]);

    } catch (e) {
      toast.error('Error', 'Could not fetch available slots.');
    } finally {
      setLoadingSlots(false);
    }

    setStep(1);
  };

  /* ── Submit follow-up booking ────────────────────────────── */
  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error('Required', 'Please select a time slot.');
      return;
    }
    setSubmitting(true);
    try {
      const consultationFee = isFOC ? 0 : Number(selectedBooking?.consultationFee || 0);

      const payload = {
        attachments: [],
        bookingFor: selectedBooking.bookingFor || 'Self',
        bookingId: selectedBooking.bookingId,
        consulationFee: consultationFee,
        doctorId: selectedBooking.doctorId,
        foc: isFOC ? 'FOC' : 'Paid',
        focReason: isFOC ? 'Free Follow-Up' : '',
        mobileNumber: profile.mobileNumber || selectedBooking.mobileNumber || '',
        partImage: '',
        parts: [],
        patientId: profile.patientId || selectedBooking.patientId || '',
        paymentType: 'Not Paid',
        serviceDate: selectedDate,
        servicetime: selectedSlot,
        theraphyAnswers: {},
        visitType: 'follow-up'
      };

      await bookingService.postFollowUpBooking(payload);
      toast.success('Booked!', 'Your follow-up appointment has been confirmed.');
      navigate('/bookings');
    } catch (err) {
      console.error('Follow-up booking error:', err);
      const msg = err?.response?.data?.message || 'Booking failed. Please try again.';
      toast.error('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Slots helpers ───────────────────────────────────────── */
  const slotsForDate = dateMap[selectedDate] || [];
  const isBooked = (s) => s.slotbooked === true || s.slotbooked === 'true';

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

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="app-page">
      {/* Hero */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}>
            <ArrowLeft size={14} /> {step > 0 ? 'Back' : 'Cancel'}
          </button>
          <h1 className="app-hero-title">Follow-Up Booking</h1>
          <p className="app-hero-sub">
            {step === 0 ? 'Select a completed appointment to follow up on'
              : step === 1 ? 'Choose your preferred date & time'
                : 'Review & confirm your follow-up'}
          </p>
        </div>
      </div>

      <div className="app-body" style={{ marginTop: -32 }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['Appointment', 'Slot', 'Confirm'].map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 4,
                background: i <= step ? 'var(--c-navy)' : 'var(--c-border)',
                transition: 'background .3s',
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: i <= step ? 'var(--c-navy)' : 'var(--c-text-3)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── STEP 0: Select Completed Appointment ────────── */}
        {step === 0 && (
          <div className="animate-fade-in">
            {loadingBookings ? (
              <div className="app-loading"><div className="app-loading-ring" /></div>
            ) : completedBookings.length === 0 ? (
              <div className="app-empty" style={{ padding: '60px 16px' }}>
                <CheckCircle size={52} />
                <p style={{ fontWeight: 700, fontSize: 16 }}>No active appointments</p>
                <p style={{ fontSize: 13 }}>You need at least one active booking to schedule a follow-up.</p>
              </div>
            ) : (
              completedBookings.map((booking, i) => (
                <div
                  key={i}
                  className="app-booking-item"
                  onClick={() => handleSelectBooking(booking)}
                  style={{ marginBottom: 12, cursor: 'pointer', transition: 'all .2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="app-icon-box app-icon-navy" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
                        <Stethoscope size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{booking.doctorName}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>#{booking.bookingId}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {booking.status && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--r-pill)',
                          background: booking.status.toLowerCase() === 'confirmed' ? 'var(--c-success-light)' : 
                                      booking.status.toLowerCase() === 'pending' ? 'var(--c-warning-light)' : 
                                      booking.status.toLowerCase().includes('progress') ? 'var(--c-navy-xlight)' : 
                                      'var(--c-surface-3)',
                          color: booking.status.toLowerCase() === 'confirmed' ? 'var(--c-success)' : 
                                 booking.status.toLowerCase() === 'pending' ? 'var(--c-warning)' : 
                                 booking.status.toLowerCase().includes('progress') ? 'var(--c-navy)' : 
                                 'var(--c-text-3)',
                          textTransform: 'capitalize'
                        }}>
                          {booking.status}
                        </span>
                      )}
                      <ChevronRight size={17} color="var(--c-text-3)" />
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', gap: 12, padding: '9px 12px',
                    background: 'var(--c-surface-2)', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--c-border-light)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} color="var(--c-navy)" />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{booking.serviceDate}</span>
                    </div>
                    <div style={{ width: 1, background: 'var(--c-border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="var(--c-navy)" />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{booking.branchname || booking.branchName || '—'}</span>
                    </div>
                  </div>
                  {Number(booking.freeFollowUps ?? 0) > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)',
                        background: 'var(--c-success-light)', color: 'var(--c-success)',
                      }}>
                        ✓ Free follow-ups available
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── STEP 1: Select Slot ──────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* FOC / Paid indicator */}
            <div className="app-card" style={{ marginBottom: 12 }}>
              <div className="app-card-body" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', margin: 0 }}>
                      {selectedBooking?.doctorName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--c-text-3)', margin: '2px 0 0' }}>
                      {selectedBooking?.branchname || selectedBooking?.branchName}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 'var(--r-pill)',
                    background: isFOC ? 'var(--c-success-light)' : 'var(--c-navy-xlight)',
                    color: isFOC ? 'var(--c-success)' : 'var(--c-navy)',
                  }}>
                    {isFOC ? '🎁 FREE Follow-Up' : `₹${selectedBooking?.consultationFee || 0}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Date scroll */}
            <div className="app-card" style={{ marginBottom: 12 }}>
              <div className="app-card-body">
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)', marginBottom: 10 }}>Select Date</p>
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: 20 }}><Loader size={22} className="spin" /></div>
                ) : (
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch' }}>
                    {Object.keys(dateMap).length > 0 ? Object.keys(dateMap)
                      .filter(d => new Date(d) >= new Date(new Date().toISOString().split('T')[0]))
                      .sort()
                      .map(d => {
                        const sel = selectedDate === d;
                        const parts = formatDateParts(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setSelectedDate(d); setSelectedSlot(''); setShowAllSlots(false); }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              padding: '12px 14px', borderRadius: 'var(--r-md)', minWidth: '76px', flexShrink: 0,
                              border: sel ? 'none' : '1px solid var(--c-border)',
                              background: sel ? 'var(--g-navy-soft)' : 'var(--c-surface)',
                              color: sel ? '#fff' : 'var(--c-text)',
                              boxShadow: sel ? 'var(--s-navy)' : 'var(--s-xs)',
                              cursor: 'pointer', transition: 'all 0.3s',
                              transform: sel ? 'scale(1.05)' : 'none',
                            }}>
                            <span style={{ fontSize: 9, fontWeight: 700, opacity: sel ? 0.9 : 0.6, letterSpacing: 0.5 }}>{parts.weekday}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, margin: '2px 0', fontFamily: 'Sora' }}>{parts.day}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, opacity: sel ? 0.9 : 0.6 }}>{parts.month}</span>
                          </button>
                        );
                    }) : (
                      <p style={{ fontSize: 13, color: 'var(--c-text-3)' }}>No available dates.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="app-card">
                <div className="app-card-body">
                  {morningSlots.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sun size={12} color="#f59e0b" /> Morning Slots
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {morningSlots.slice(0, showAllSlots ? morningSlots.length : 6).map((s, i) => {
                          const sel = selectedSlot === s.slot;
                          const booked = isBooked(s);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={booked}
                              onClick={() => !booked && setSelectedSlot(s.slot)}
                              style={{
                                padding: '12px 6px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700,
                                border: sel ? '2px solid var(--c-navy)' : booked ? '1px dashed var(--c-border)' : '1px solid var(--c-border)',
                                background: sel ? 'var(--c-navy-xlight)' : booked ? 'var(--c-surface-3)' : 'var(--c-surface)',
                                color: sel ? 'var(--c-navy)' : booked ? 'var(--c-text-3)' : 'var(--c-text)',
                                cursor: booked ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all .2s',
                                opacity: booked ? 0.5 : 1, textDecoration: booked ? 'line-through' : 'none',
                              }}
                            >
                              {s.slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {afternoonSlots.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sunset size={12} color="#ea6800" /> Afternoon / Evening Slots
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {afternoonSlots.slice(0, showAllSlots ? afternoonSlots.length : 6).map((s, i) => {
                          const sel = selectedSlot === s.slot;
                          const booked = isBooked(s);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={booked}
                              onClick={() => !booked && setSelectedSlot(s.slot)}
                              style={{
                                padding: '12px 6px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700,
                                border: sel ? '2px solid var(--c-navy)' : booked ? '1px dashed var(--c-border)' : '1px solid var(--c-border)',
                                background: sel ? 'var(--c-navy-xlight)' : booked ? 'var(--c-surface-3)' : 'var(--c-surface)',
                                color: sel ? 'var(--c-navy)' : booked ? 'var(--c-text-3)' : 'var(--c-text)',
                                cursor: booked ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all .2s',
                                opacity: booked ? 0.5 : 1, textDecoration: booked ? 'line-through' : 'none',
                              }}
                            >
                              {s.slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {morningSlots.length === 0 && afternoonSlots.length === 0 && !loadingSlots && (
                    <p style={{ fontSize: 13, color: 'var(--c-text-3)', textAlign: 'center' }}>No slots for this date.</p>
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
              </div>
            )}

            {/* Next button */}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => {
                  if (!selectedSlot) { toast.error('Required', 'Please select a time slot.'); return; }
                  setStep(2);
                }}
                style={{
                  width: '100%', padding: 14, borderRadius: 'var(--r-sm)',
                  border: 'none', background: 'var(--g-navy-soft)',
                  fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                Next <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Confirm ──────────────────────────────── */}
        {step === 2 && (
          <div className="app-card animate-fade-in">
            <div className="app-card-body">
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)', marginBottom: 12 }}>Booking Summary</p>

              {[
                { label: 'Visit Type', value: 'Follow-up Visit' },
                { label: 'Doctor', value: selectedBooking?.doctorName },
                { label: 'Branch', value: selectedBooking?.branchname || selectedBooking?.branchName },
                { label: 'Date', value: formatDateLabel(selectedDate) },
                { label: 'Time', value: selectedSlot },
                { label: 'Patient', value: profile.fullName || user?.name },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--c-border-light)' }}>
                  <span style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>{value || '—'}</span>
                </div>
              ))}

              {/* Fee row */}
              <div style={{
                marginTop: 14, padding: '12px 14px',
                background: isFOC ? 'var(--c-success-light)' : 'var(--c-navy-xlight)',
                borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: isFOC ? 'var(--c-success)' : 'var(--c-navy)' }}>
                  Consultation Fee
                </span>
                <span style={{ fontWeight: 800, fontSize: 18, color: isFOC ? 'var(--c-success)' : 'var(--c-navy)' }}>
                  {isFOC ? 'FREE' : `₹${selectedBooking?.consultationFee || 0}`}
                </span>
              </div>

              {/* Payment note */}
              <div style={{ marginTop: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--r-pill)',
                  background: 'var(--c-navy-xlight)', color: 'var(--c-navy)',
                }}>🚫 Not Paid</span>
                <p style={{ marginTop: 6, fontSize: 11, color: 'var(--c-text-3)', fontStyle: 'italic' }}>
                  * You can pay at the hospital during your appointment.
                </p>
              </div>

              {/* Problem */}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-navy)', display: 'block', marginBottom: 6 }}>
                  Describe Your Problem
                </label>
                <textarea
                  value={problem}
                  onChange={e => setProblem(e.target.value)}
                  rows={3}
                  placeholder="Describe current symptoms or reason for follow-up…"
                  style={{
                    width: '100%', border: '1.5px solid var(--c-border)',
                    borderRadius: 'var(--r-sm)', padding: '10px 12px',
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    color: 'var(--c-text)', resize: 'none', outline: 'none',
                    background: 'var(--c-surface-2)',
                  }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: 14, borderRadius: 'var(--r-sm)',
                    border: '1.5px solid var(--c-border)', background: 'var(--c-surface)',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'var(--c-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <ChevronLeft size={17} /> Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{
                    flex: 2, padding: 14, borderRadius: 'var(--r-sm)',
                    border: 'none', background: submitting ? 'var(--c-border)' : 'var(--g-navy-soft)',
                    fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: 'var(--s-navy)',
                  }}>
                  {submitting ? <><Loader size={16} className="spin" /> Confirming…</> : 'Confirm Follow-Up'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FollowUpBooking;
