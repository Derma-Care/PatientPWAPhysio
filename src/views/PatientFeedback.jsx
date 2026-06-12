import React, { useEffect, useMemo, useState } from 'react';
import '../styles/PatientFeedback.css';
import { BASE_URL, feedbackService } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';

const RATING_OPTIONS = [
    { id: '1', emoji: '😡' },
    { id: '2', emoji: '😠' },
    { id: '3', emoji: '😞' },
    { id: '4', emoji: '😟' },
    { id: '5', emoji: '😐' },
    { id: '6', emoji: '🙂' },
    { id: '7', emoji: '😊' },
    { id: '8', emoji: '😄' },
    { id: '9', emoji: '😍' },
    { id: '10', emoji: '🤩' }
];

const ROLE_CONFIG = [
    { key: 'doctor', label: 'Doctor', icon: '🩺' },
    { key: 'therapist', label: 'Therapist', icon: '🏥' },
    { key: 'receptionist', label: 'Receptionist', icon: '🧾' }
];


const getRatingLabel = (id) => {
    const map = { 1: 'Terrible', 2: 'Bad', 3: 'Poor', 4: 'Unsatisfied', 5: 'Neutral', 6: 'Okay', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Amazing' };
    return map[parseInt(id)] || '';
};

const RatingRow = ({ value, onChange }) => (
    <div className="pf-rating-grid">
        {RATING_OPTIONS.map((item) => (
            <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`pf-rating-btn ${value === item.id ? 'pf-rating-btn--active' : ''}`}
            >
                <span className="pf-rating-emoji">{item.emoji}</span>
                <span className="pf-rating-num">{item.id}</span>
            </button>
        ))}
    </div>
);

const StaffFeedbackSection = ({ roleConfig, staffList, data, onChange }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={`pf-staff-section ${open ? 'pf-staff-section--open' : ''}`}>
            <button type="button" className="pf-staff-header" onClick={() => setOpen(!open)}>
                <span className="pf-staff-icon">{roleConfig.icon}</span>
                <span className="pf-staff-label">{roleConfig.label} Feedback</span>
                {data.rating && (
                    <span className="pf-staff-preview">
                        {RATING_OPTIONS.find(r => r.id === data.rating)?.emoji} {getRatingLabel(data.rating)}
                    </span>
                )}
                <svg
                    className={`pf-staff-chevron ${open ? 'pf-staff-chevron--open' : ''}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div className="pf-staff-body">
                    <div className="pf-field">
                        <label className="pf-label">Select {roleConfig.label}</label>
                        <div className="pf-select-wrap">
                            <select
                                value={data.targetId}
                                onChange={(e) => onChange({ ...data, targetId: e.target.value })}
                                className="pf-select"
                            >
                                <option value="">Choose a person</option>
                                {staffList.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <svg className="pf-select-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="pf-field">
                        <label className="pf-label">
                            Rating
                            {data.rating && <span className="pf-rating-label-text"> — {getRatingLabel(data.rating)}</span>}
                        </label>
                        <RatingRow value={data.rating} onChange={(val) => onChange({ ...data, rating: val })} />
                    </div>

                    <div className="pf-field">
                        <label className="pf-label">Comments</label>
                        <textarea
                            className="pf-textarea"
                            placeholder={`Share your experience with this ${roleConfig.label.toLowerCase()}…`}
                            value={data.feedbackText}
                            onChange={(e) => onChange({ ...data, feedbackText: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const PatientFeedback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [patient, setPatient] = useState({
        patientId: '', patientName: '', patientPhone: '', clinicId: '', branchId: ''
    });

    const clinicId = location.state.clinicId;
    const branchId = location.state.branchId;
    const [loading, setLoading] = useState(false)
    const [hospitalFeedback, setHospitalFeedback] = useState({ rating: '', feedbackText: '' });

    const [staffFeedback, setStaffFeedback] = useState({
        doctor: { targetId: '', rating: '', feedbackText: '' },
        therapist: { targetId: '', rating: '', feedbackText: '' },
        receptionist: { targetId: '', rating: '', feedbackText: '' }
    });

    useEffect(() => {
        console.log(location.state);
        if (location.state) {
            setPatient({
                patientId: location.state.patientId || '',
                patientName: location.state.patientName || '',
                patientPhone: location.state.patientPhone || '',
                clinicId: clinicId || '',
                branchId: branchId || ''
            });
        }
    }, [location.state]);

    useEffect(() => {
        // alert(clinicId + branchId);
        const fetchStaff = async () => {
            try {
                setLoading(true)
                if (!clinicId || !branchId) return;

                const res = await feedbackService.getClinicStaffInfo(
                    clinicId,
                    branchId
                );

                if (res?.status === 200 && res?.data) {

                    const formattedUsers = [

                        ...(res.data.DOCTOR || []).map(item => ({
                            ...item,
                            role: 'doctor'
                        })),

                        ...(res.data.THERAPIST || []).map(item => ({
                            ...item,
                            role: 'therapist'
                        })),

                        ...(res.data.RECEPTIONIST || []).map(item => ({
                            ...item,
                            role: 'receptionist'
                        }))

                    ];

                    setUsers(formattedUsers);
                }

            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false)
            }
        };

        fetchStaff();
    }, [clinicId, branchId]);

    const handleSubmit = async () => {
        if (!hospitalFeedback.rating) {
            toast.warning('Rating Required', 'Please provide an overall rating for the Hospital / Clinic.');
            return;
        }

        const sf = staffFeedback;

        const payload = {
            clinicId: patient.clinicId,
            branchId: patient.branchId,
            patientId: patient.patientId,
            patientName: patient.patientName,
            patientPhone: patient.patientPhone,

            hospitalFeedback: {
                rating: hospitalFeedback.rating,
                feedbackText: hospitalFeedback.feedbackText
            },

            doctorFeedback: sf.doctor.targetId
                ? { targetId: sf.doctor.targetId, rating: sf.doctor.rating, feedbackText: sf.doctor.feedbackText }
                : null,

            therapistFeedback: sf.therapist.targetId
                ? { targetId: sf.therapist.targetId, rating: sf.therapist.rating, feedbackText: sf.therapist.feedbackText }
                : null,

            receptionistFeedback: sf.receptionist.targetId
                ? { targetId: sf.receptionist.targetId, rating: sf.receptionist.rating, feedbackText: sf.receptionist.feedbackText }
                : null,

            date: new Date().toISOString()
        };

        console.log(payload);

        try {
            setLoading(true);

            const result = await feedbackService.createPatientFeedback(payload);

            console.log(result);

            if (result) {
                toast.success(result.message || 'Feedback Submitted Successfully');
                navigate(-1)
            } else {
                toast.error(result.message || 'Feedback Not Submitted');
            }

        } catch (error) {

            console.log(error);

            toast.error(
                error?.response?.data?.message ||
                'Something went wrong'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pf-root">

            {/* Header */}
            <div className="pf-header">
                <div className="pf-header__inner">
                    <button className="pf-back-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Bookings
                    </button>
                    <div className="pf-header__title-row">
                        <div>
                            <h1 className="pf-header__title">Patient Feedback</h1>
                            {patient.patientId && <p className="pf-header__ref">ID: {patient.patientId}</p>}
                        </div>
                        <span className="pf-badge">
                            <span className="pf-badge__dot" />
                            FEEDBACK
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="pf-body">

                {/* Patient info */}
                <div className="pf-info-card">
                    <p className="pf-info-card__label">Patient Details</p>
                    <div className="pf-info-grid">
                        <div className="pf-info-item">
                            <span className="pf-info-item__icon">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M1.5 13c0-3.038 2.462-5 5.5-5s5.5 1.962 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </span>
                            <div>
                                <span className="pf-info-item__key">Name</span>
                                <span className="pf-info-item__val">{patient.patientName || '—'}</span>
                            </div>
                        </div>
                        <div className="pf-info-item">
                            <span className="pf-info-item__icon">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 7h4M5 9.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </span>
                            <div>
                                <span className="pf-info-item__key">Patient ID</span>
                                <span className="pf-info-item__val">{patient.patientId || '—'}</span>
                            </div>
                        </div>
                        <div className="pf-info-item">
                            <span className="pf-info-item__icon">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5h2l1 3-1.5 1a8 8 0 003.5 3.5l1-1.5 3 1v2A1.5 1.5 0 0110 13C5.029 13 1 8.971 1 4a1.5 1.5 0 011.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </span>
                            <div>
                                <span className="pf-info-item__key">Phone</span>
                                <span className="pf-info-item__val">{patient.patientPhone || '—'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end">
                        <span className="pf-badge d-flex justify-content-end" style={{ color: "var(--c-navy)" }} onClick={() => navigate('/PatientFeedbackDashboard', { state: { clinicId: patient.clinicId, branchId: patient.branchId, patientId: patient.patientId } })}>
                            <span className="pf-badge__dot" />
                            ⭐ View
                        </span>
                    </div>
                </div>

                {/* Section: Overall */}
                <div className="pf-section-label">
                    <span className="pf-section-label__line" />
                    <span className="pf-section-label__text">Overall Experience</span>
                    <span className="pf-section-label__line" />
                </div>

                {/* Hospital feedback */}
                <div className="pf-form-card">
                    <div className="pf-card-header">
                        <span className="pf-card-icon">🏨</span>
                        <div>
                            <p className="pf-card-title">Hospital / Clinic</p>
                            <p className="pf-card-sub">Rate your overall visit experience</p>
                        </div>
                        {hospitalFeedback.rating && (
                            <span className="pf-card-rating-badge">
                                {RATING_OPTIONS.find(r => r.id === hospitalFeedback.rating)?.emoji}
                                <span>{getRatingLabel(hospitalFeedback.rating)}</span>
                            </span>
                        )}
                    </div>

                    <div className="pf-field">
                        <label className="pf-label">
                            Rating
                            {hospitalFeedback.rating && (
                                <span className="pf-rating-label-text"> — {getRatingLabel(hospitalFeedback.rating)}</span>
                            )}
                        </label>
                        <RatingRow
                            value={hospitalFeedback.rating}
                            onChange={(val) => setHospitalFeedback({ ...hospitalFeedback, rating: val })}
                        />
                    </div>

                    <div className="pf-field">
                        <label className="pf-label">Comments</label>
                        <textarea
                            className="pf-textarea"
                            placeholder="How was the overall clinic experience — facilities, cleanliness, wait time…"
                            value={hospitalFeedback.feedbackText}
                            onChange={(e) => setHospitalFeedback({ ...hospitalFeedback, feedbackText: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Section: Staff */}
                <div className="pf-section-label">
                    <span className="pf-section-label__line" />
                    <span className="pf-section-label__text">
                        Staff Feedback <span className="pf-section-label__opt">(optional)</span>
                    </span>
                    <span className="pf-section-label__line" />
                </div>

                {/* Staff accordion */}
                <div className="pf-staff-list">
                    {ROLE_CONFIG.map((roleConfig) => (
                        <StaffFeedbackSection
                            key={roleConfig.key}
                            roleConfig={roleConfig}
                            staffList={users.filter(u => u.role === roleConfig.key)}
                            data={staffFeedback[roleConfig.key]}
                            onChange={(updated) =>
                                setStaffFeedback((prev) => ({ ...prev, [roleConfig.key]: updated }))
                            }
                        />
                    ))}
                </div>

                {/* Submit */}
                <button
                    className="pf-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                >

                    {loading ? (
                        <>
                            <span className="pf-loader"></span>
                            Submitting...
                        </>
                    ) : (
                        'Submit Feedback'
                    )}

                </button>
                {/* <button className="pf-submit-btn mt-2" onClick={() => navigate('/PatientFeedbackDashboard')}>
                    Patient Feedback Dashboard
                </button> */}



            </div>
        </div>
    );
};

export default PatientFeedback;