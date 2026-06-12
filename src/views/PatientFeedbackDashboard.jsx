import React, { useEffect, useState, useRef } from 'react';
import '../styles/PatientFeedback.css'
import { BASE_URL, feedbackService } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// ─── Constants ────────────────────────────────────────────────────────────────


const EMOJIS = {
    1: '😡', 2: '😠', 3: '😞', 4: '😟', 5: '😐',
    6: '🙂', 7: '😊', 8: '😄', 9: '😍', 10: '🤩',
};

const RATING_LABELS = {
    1: 'Terrible', 2: 'Bad', 3: 'Poor', 4: 'Unsatisfied', 5: 'Neutral',
    6: 'Okay', 7: 'Good', 8: 'Great', 9: 'Excellent', 10: 'Amazing',
};

const CATEGORY_CONFIG = [
    { key: 'hospitalFeedback', label: 'Hospital', color: '#378ADD' },
    { key: 'doctorFeedback', label: 'Doctor', color: '#1D9E75' },
    { key: 'therapistFeedback', label: 'Therapist', color: '#D4537E' },
    { key: 'receptionistFeedback', label: 'Receptionist', color: '#BA7517' },
];

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'hospitalFeedback', label: 'Hospital' },
    { key: 'doctorFeedback', label: 'Doctor' },
    { key: 'therapistFeedback', label: 'Therapist' },
    { key: 'receptionistFeedback', label: 'Receptionist' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRatingColor = (r) => {
    if (r >= 8) return '#1D9E75';
    if (r >= 6) return '#BA7517';
    if (r >= 4) return '#D85A30';
    return '#E24B4A';
};

const getInitials = (name) =>
    name
        .replace(/^Mr\.?\s*/i, '')
        .split(' ')
        .map((w) => w[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const getAllRatings = (rec) =>
    CATEGORY_CONFIG.map((c) => rec[c.key]?.rating)
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n));

const avgRating = (rec) => {
    const rs = getAllRatings(rec);
    return rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetricCard = ({ label, value, suffix }) => (
    <div style={styles.metric}>
        <div style={styles.metricLabel}>{label}</div>
        <div style={styles.metricValue}>
            {value}
            {suffix && <span style={styles.metricSuffix}>{suffix}</span>}
        </div>
    </div>
);

const StarBar = ({ rating, size = 8 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: 10 }, (_, i) => (
            <span
                key={i}
                style={{
                    width: size,
                    height: size,
                    borderRadius: 1,
                    background: i < rating ? getRatingColor(rating) : '#D3D1C7',
                    display: 'inline-block',
                }}
            />
        ))}
    </div>
);

const RatingChip = ({ feedback, label, color }) => {
    if (!feedback?.rating) return null;
    const r = parseInt(feedback.rating);
    if (isNaN(r)) return null;
    return (
        <div style={styles.chip}>
            <span style={styles.chipLabel}>{label}</span>
            <StarBar rating={r} />
            <span style={{ fontSize: 13, fontWeight: 500, color }}>
                {EMOJIS[r]} {r}
            </span>
            <span style={{ fontSize: 11, color: '#888780' }}>{RATING_LABELS[r]}</span>
        </div>
    );
};

const FeedbackCard = ({ rec }) => {
    const avg = avgRating(rec);
    const avgStr = avg ? avg.toFixed(1) : null;
    const avgColor = avg ? getRatingColor(Math.round(avg)) : null;
    const initials = getInitials(rec.patientName);

    const comments = CATEGORY_CONFIG.map((c) => rec[c.key]?.feedbackText)
        .filter(Boolean);

    return (
        <div style={styles.feedCard}>
            {/* Top row */}
            <div style={styles.feedTop}>
                <div style={styles.feedPatient}>
                    <div style={styles.avatar}>{initials}</div>
                    <div>
                        <div style={styles.feedName}>{rec.patientName}</div>
                        <div style={styles.feedMeta}>
                            {rec.patientPhone}&nbsp;·&nbsp;{rec.patientId}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {avgStr && (
                        <>
                            <span style={{ fontSize: 20, fontWeight: 500, color: avgColor }}>{avgStr}</span>
                            <span style={{ fontSize: 11, color: '#888780' }}>avg</span>
                        </>
                    )}
                    <span style={styles.feedDate}>📅 {formatDate(rec.date)}</span>
                </div>
            </div>

            {/* Rating chips */}
            <div style={styles.chips}>
                {CATEGORY_CONFIG.map((c) => (
                    <RatingChip
                        key={c.key}
                        feedback={rec[c.key]}
                        label={c.label}
                        color={c.color}
                    />
                ))}
                {!CATEGORY_CONFIG.some((c) => rec[c.key]?.rating) && (
                    <span style={{ fontSize: 12, color: '#888780' }}>No rated feedback</span>
                )}
            </div>

            {/* Comments */}
            {comments.length > 0 && (
                <div style={styles.commentText}>
                    💬 {comments.join(' · ')}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PatientFeedbackDashboard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {

        const fetchFeedback = async () => {


            try {
                setLoading(true);

                const res = await feedbackService.getByPatientFeedbackClinicIdAndBranchId(location.state.clinicId, location.state.branchId, location.state.patientId);

                console.log(res.data);

                if (!res.success) throw new Error(res.message || 'Fetch failed');
                setData(res.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }

        };
        fetchFeedback();
    }, []);

    // Metrics
    const allRatings = data.flatMap(getAllRatings);
    const totalAvg = allRatings.length
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : '—';
    const positivePct = allRatings.length
        ? Math.round((allRatings.filter((r) => r >= 7).length / allRatings.length) * 100)
        : 0;
    const uniquePatients = new Set(data.map((r) => r.patientId)).size;

    // Filtered list
    const filtered =
        activeFilter === 'all'
            ? data
            : data.filter((rec) => rec[activeFilter]?.rating);

    if (loading) {
        return (
            <div style={styles.center}>
                <div style={styles.spinner} />
                <p style={{ color: '#888780', marginTop: 12, fontSize: 14 }}>Loading feedback…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.center}>
                <p style={{ color: '#E24B4A', fontSize: 14 }}>⚠️ {error}</p>
            </div>
        );
    }

    return (
        <div>

            {/* HERO */}
            <div className="app-hero">
                <div className="app-hero-inner">
                    <button className="app-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} /> Back to Feedback
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="app-hero-title">Patient Feedback</h1>
                            {/* <p className="app-hero-sub">{`Clinic ${location.state.clinicId} · Branch ${location.state.branchId}`} </p> */}
                        </div>
                        {/* <div className={`app-status-pill ${statusClass(booking.status)}`}>
                            <span className="app-status-dot" />
                            {booking.status}
                        </div> */}
                    </div>
                </div>
            </div>
            <div style={styles.root}>





                {/* Metrics */}
                <div style={styles.metricsGrid}>
                    <MetricCard label="Total responses" value={data.length} />
                    <MetricCard label="Average rating" value={totalAvg} suffix="/10" />
                    <MetricCard label="Positive (≥7)" value={positivePct} suffix="%" />
                    <MetricCard label="Unique patients" value={uniquePatients} />
                </div>

                {/* Category counts */}
                <div style={styles.catRow}>
                    {CATEGORY_CONFIG.map((c) => {
                        const count = data.filter((r) => r[c.key]?.rating).length;
                        return (
                            <div key={c.key} style={{ ...styles.catCard, borderTop: `3px solid ${c.color}` }}>
                                <div style={{ ...styles.catCount, color: c.color }}>{count}</div>
                                <div style={styles.catLabel}>{c.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter */}
                <div style={styles.filterRow}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            style={{
                                ...styles.filterBtn,
                                ...(activeFilter === f.key ? styles.filterBtnActive : {}),
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                    <span style={{ fontSize: 12, color: '#888780', marginLeft: 'auto', alignSelf: 'center' }}>
                        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Feedback list */}
                <div style={styles.feedList}>
                    {filtered.length === 0 ? (
                        <div style={styles.empty}>No feedback matches this filter.</div>
                    ) : (
                        filtered.map((rec) => <FeedbackCard key={rec.id} rec={rec} />)
                    )}
                </div>

            </div>

        </div>

    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
    root: {
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        maxWidth: 860,
        margin: '0 auto',
        padding: '24px 16px',
        color: '#2C2C2A',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    pageTitle: { fontSize: 22, fontWeight: 600, color: '#2C2C2A', margin: 0 },
    pageSub: { fontSize: 13, color: '#888780', marginTop: 2 },
    liveBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        padding: '5px 12px',
        borderRadius: 8,
        border: '1px solid #D3D1C7',
        color: '#5F5E5A',
    },
    liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#1D9E75' },

    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        marginBottom: 16,
    },
    metric: {
        background: '#F1EFE8',
        borderRadius: 8,
        padding: '14px 16px',
    },
    metricLabel: { fontSize: 11, color: '#888780', marginBottom: 4 },
    metricValue: { fontSize: 26, fontWeight: 600, color: '#2C2C2A' },
    metricSuffix: { fontSize: 13, color: '#888780', fontWeight: 400 },

    catRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 10,
        marginBottom: 24,
    },
    catCard: {
        background: '#fff',
        border: '1px solid #D3D1C7',
        borderRadius: 10,
        padding: '12px 14px',
        textAlign: 'center',
    },
    catCount: { fontSize: 24, fontWeight: 600 },
    catLabel: { fontSize: 12, color: '#888780', marginTop: 2 },

    filterRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
        alignItems: 'center',
    },
    filterBtn: {
        fontSize: 12,
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid #D3D1C7',
        background: 'transparent',
        cursor: 'pointer',
        color: '#5F5E5A',
        transition: 'all 0.15s',
    },
    filterBtnActive: {
        background: '#EAF3DE',
        color: '#3B6D11',
        borderColor: '#97C459',
        fontWeight: 500,
    },

    feedList: { display: 'flex', flexDirection: 'column', gap: 10 },
    feedCard: {
        background: '#fff',
        border: '1px solid #D3D1C7',
        borderRadius: 12,
        padding: '14px 16px',
    },
    feedTop: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    feedPatient: { display: 'flex', alignItems: 'center', gap: 10 },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#E6F1FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 600,
        color: '#185FA5',
        flexShrink: 0,
    },
    feedName: { fontSize: 14, fontWeight: 600, color: '#2C2C2A' },
    feedMeta: { fontSize: 12, color: '#888780' },
    feedDate: { fontSize: 11, color: '#888780' },

    chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        padding: '5px 10px',
        borderRadius: 8,
        border: '1px solid #D3D1C7',
        background: '#F1EFE8',
        color: '#5F5E5A',
    },
    chipLabel: { fontSize: 11, color: '#888780' },

    commentText: {
        fontSize: 12,
        color: '#5F5E5A',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid #D3D1C7',
        lineHeight: 1.6,
    },

    empty: { fontSize: 13, color: '#888780', textAlign: 'center', padding: '2rem' },
    center: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
    },
    spinner: {
        width: 28,
        height: 28,
        border: '3px solid #D3D1C7',
        borderTopColor: '#1D9E75',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};

export default PatientFeedbackDashboard;