import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Wallet,
    CreditCard,
    Calendar,
    CheckCircle,
    Clock,
    Activity,
    BadgeIndianRupee,
    User,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    Dumbbell,
    Stethoscope,
    LayoutGrid,
    ClipboardList,
    ArrowLeft
} from 'lucide-react';
import '../styles/PaymentDetails.css'
import { paymentService } from '../services/api';

const PaymentDetails = () => {
    const { bookingId } = useParams();

    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState(null);
    const [expandedPrograms, setExpandedPrograms] = useState({});
    const [expandedTherapies, setExpandedTherapies] = useState({});
    const [expandedExercises, setExpandedExercises] = useState({});
    const navigate = useNavigate();
    useEffect(() => {
        fetchPayment();
    }, []);

    const fetchPayment = async () => {
        try {
            const response = await paymentService.getPayment(bookingId)
            if (response.success) {
                setPaymentData(response.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProgram = (pIdx) => {
        setExpandedPrograms(prev => ({ ...prev, [pIdx]: !prev[pIdx] }));
    };

    const toggleTherapy = (key) => {
        setExpandedTherapies(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleExercise = (key) => {
        setExpandedExercises(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="pd-loading-state">
                <div className="pd-loading-spinner" />
                <p>Loading payment details...</p>
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="pd-empty-state">
                <CreditCard size={48} strokeWidth={1.2} />
                <p>No payment data found</p>
            </div>
        );
    }

    const stats = [
        { label: 'Total Amount', value: paymentData.totalAmount, icon: BadgeIndianRupee, color: 'var(--c-navy)', iconBg: 'var(--c-navy-xlight)', accent: 'navy' },
        { label: 'Discount', value: paymentData.discountAmount, icon: Wallet, color: 'var(--c-orange)', iconBg: 'var(--c-orange-light)', accent: 'orange' },
        { label: 'Paid Amount', value: paymentData.totalPaid, icon: CheckCircle, color: 'var(--c-info)', iconBg: 'var(--c-info-light)', accent: 'sky' },
        { label: 'Balance', value: paymentData.balanceAmount, icon: CreditCard, color: 'var(--c-danger)', iconBg: 'var(--c-danger-light)', accent: 'rose' },
    ];

    return (
        <div className="app-page">

            {/* ── HERO HEADER ── */}


            <div className="app-hero">
                <div className="app-hero-inner">
                    <button className="app-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} /> Back to Bookings
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="app-hero-title">Payment Details</h1>
                            <p className="app-hero-sub">Ref ID: {paymentData.bookingId}</p>
                        </div>
                        <div className="pd-hero-right">
                            <span className={`pd-status-badge ${paymentData.paymentStatus === 'Paid' ? 'paid' : paymentData.paymentStatus === 'Partial' ? 'partial' : 'unpaid'}`}>
                                <span className="pd-status-dot" />
                                {paymentData.paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SUMMARY STRIP ── */}
            {/* <div className="pd-summary-strip">
                <SummaryTile
                    icon={BadgeIndianRupee}
                    label="Total Amount"
                    value={`₹${paymentData.totalAmount}`}
                    accent="blue"
                />
                <SummaryTile
                    icon={Wallet}
                    label="Discount"
                    value={`₹${paymentData.discountAmount}`}
                    accent="purple"
                />
                <SummaryTile
                    icon={CheckCircle}
                    label="Paid Amount"
                    value={`₹${paymentData.totalPaid}`}
                    accent="green"
                />
                <SummaryTile
                    icon={CreditCard}
                    label="Balance"
                    value={`₹${paymentData.balanceAmount}`}
                    accent="orange"
                />
            </div> */}

            <div className="dashboard-stats-grid mb-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="dashboard-stat-card">
                        <div
                            className="stat-icon-circle"
                            style={{ background: `${stat.color}15`, color: stat.color }}
                        >
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <div className="stat-title">{stat.label}</div>
                            <div className="stat-number">₹ {stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── SESSION INFO ── */}
            <div className="pd-section">
                <div className="pd-section-header">
                    <LayoutGrid size={16} />
                    <span>Session Information</span>
                </div>
                <div className="pd-info-grid">
                    <InfoTile label="Total Sessions" value={paymentData.totalSessionCount} />
                    <InfoTile label="Completed Sessions" value={paymentData.noOfSessionCompletedCount} />
                    <InfoTile label="Session Start Date" value={paymentData.sessionStartDate} />
                    <InfoTile label="Overall Status" value={paymentData.overallStatus} />
                </div>
            </div>

            {/* ── PAYMENT HISTORY ── */}
            <div className="pd-section">
                <div className="pd-section-header">
                    <div className="pd-header-left">
                        <ClipboardList size={18} />
                        <span>Payment History</span>
                    </div>

                    <span className="pd-badge">
                        {paymentData.paymentHistory?.length || 0} Payments
                    </span>
                </div>

                <div className="pd-timeline">
                    {paymentData.paymentHistory?.map((payment, index) => (
                        <div className="pd-timeline-item" key={index}>

                            <div className="pd-line-dot"></div>

                            <div className="pd-payment-row">

                                <div className="pd-left">


                                    <div>
                                        <h4>₹{payment.amount}</h4>
                                        <p>{payment.paymentDate}</p>
                                    </div>
                                    <div className="pd-right">
                                        <span className="pd-chip mode">
                                            {payment.paymentMode}
                                        </span>

                                        <span className="pd-chip type">
                                            {payment.paymentType}
                                        </span>

                                        <span className="pd-chip level">
                                            {payment.paymentLevel}
                                        </span>
                                    </div>
                                </div>



                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── THERAPY ACTIVITIES ── */}
            <div className="pd-section">
                <div className="pd-section-header">
                    <Activity size={16} />
                    <span>Therapy Activities</span>
                    <span className="pd-badge">{paymentData.therapyWithSessions?.length} Activities</span>
                </div>

                <div className="pd-programs-list">
                    {paymentData.therapyWithSessions?.map((program, pIdx) => {

                        const therapyCount = program.therapyData?.length || 0;
                        const exerciseCount = program.therapyData?.reduce(
                            (acc, therapy) => acc + (therapy.exercises?.length || 0), 0
                        );
                        const isExpanded = expandedPrograms[pIdx] !== false; // default open

                        return (
                            <div key={pIdx} className="pd-program-block">

                                {/* Program Header */}
                                <div
                                    className="pd-program-header"
                                    onClick={() => toggleProgram(pIdx)}
                                >
                                    <div className="pd-program-header-left">
                                        <div className="pd-program-icon">
                                            <Stethoscope size={18} />
                                        </div>
                                        <div>
                                            <h4 className="pd-program-name">{program.programName}</h4>
                                            <span className="pd-program-id">ID: {program.programId}</span>
                                        </div>
                                    </div>
                                    <div className="pd-program-header-right">
                                        <div className="pd-program-meta">
                                            <span className="pd-meta-chip">{therapyCount} Therapies</span>
                                            <span className="pd-meta-chip">{exerciseCount} Exercises</span>
                                        </div>
                                        <div className={`status-pill ${program.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                            {program.paymentStatus}
                                        </div>
                                        {isExpanded
                                            ? <ChevronUp size={16} className="pd-chevron" />
                                            : <ChevronDown size={16} className="pd-chevron" />
                                        }
                                    </div>
                                </div>

                                {/* Therapies */}
                                {isExpanded && (
                                    <div className="pd-therapies-list">
                                        {program.therapyData?.map((therapy, tIdx) => {

                                            const therapyKey = `${pIdx}-${tIdx}`;
                                            const isTherapyExpanded = expandedTherapies[therapyKey] !== false;

                                            const paidExercises = therapy.exercises?.filter(
                                                ex => ex.paymentStatus === 'Paid'
                                            ).length;

                                            return (
                                                <div key={tIdx} className="pd-therapy-block">

                                                    {/* Therapy Header */}
                                                    <div
                                                        className="pd-therapy-header"
                                                        onClick={() => toggleTherapy(therapyKey)}
                                                    >
                                                        <div className="pd-therapy-header-left">
                                                            <div className="pd-therapy-icon">
                                                                <Dumbbell size={14} />
                                                            </div>
                                                            <div>
                                                                <h5 className="pd-therapy-name">{therapy.therapyName}</h5>
                                                                <div className="pd-program-meta w-100  mt-3">
                                                                    <small className="pd-meta-chip">{therapy.exercises?.length} Act</small>
                                                                    <small className="pd-meta-chip success">{paidExercises} Paid</small>
                                                                    <small className="pd-meta-chip danger">{therapy.exercises?.length - paidExercises} Pending</small>
                                                                </div>
                                                                {/* <small className="text-muted">ID: {therapy.therapyId}</small> */}
                                                            </div>
                                                        </div>
                                                        <div className="pd-therapy-header-right">

                                                            {/* <div className={`status-pill ${therapy.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                                                {therapy.paymentStatus}
                                                            </div> */}
                                                            {isTherapyExpanded
                                                                ? <ChevronUp size={14} className="pd-chevron" />
                                                                : <ChevronDown size={14} className="pd-chevron" />
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Exercises */}
                                                    {isTherapyExpanded && (
                                                        <div className="pd-exercises-list">
                                                            {therapy.exercises?.map((exercise, eIdx) => {

                                                                const exerciseKey = `${pIdx}-${tIdx}-${eIdx}`;
                                                                const isExerciseExpanded = expandedExercises[exerciseKey] !== false;

                                                                const completedSessions = exercise.sessions?.filter(
                                                                    s => s.status === 'Completed'
                                                                ).length;

                                                                const paidSessions = exercise.sessions?.filter(
                                                                    s => s.paymentStatus === 'Paid'
                                                                ).length;

                                                                return (
                                                                    <div key={eIdx} className="pd-exercise-block">

                                                                        {/* Exercise Header */}
                                                                        <div
                                                                            className="pd-exercise-header"
                                                                            onClick={() => toggleExercise(exerciseKey)}
                                                                        >
                                                                            <div className="pd-exercise-header-left">
                                                                                <h6 className="pd-exercise-name">{exercise.exerciseName}</h6>
                                                                                <small className="text-muted">
                                                                                    {exercise.bodyPart} · {exercise.activityType}
                                                                                </small>
                                                                            </div>
                                                                            <div className="pd-exercise-header-right">
                                                                                {/* <div className={`status-pill ${exercise.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                                                                    {exercise.paymentStatus}
                                                                                </div> */}
                                                                                {isExerciseExpanded
                                                                                    ? <ChevronUp size={13} className="pd-chevron" />
                                                                                    : <ChevronDown size={13} className="pd-chevron" />
                                                                                }
                                                                            </div>
                                                                        </div>

                                                                        {/* Exercise Details */}
                                                                        {isExerciseExpanded && (
                                                                            <>
                                                                                {/* <div className="pd-info-grid mt-2">
                                                                                    <InfoTile label="Sessions" value={exercise.noOfSessions} />
                                                                                    <InfoTile label="Paid Sessions" value={paidSessions} />
                                                                                    <InfoTile label="Completed Sessions" value={completedSessions} />
                                                                                    <InfoTile label="Sets" value={exercise.sets} />
                                                                                    <InfoTile label="Repetitions" value={exercise.repetitions} />
                                                                                    <InfoTile label="Frequency" value={exercise.frequency} />
                                                                                    <InfoTile label="Duration" value={exercise.activityDuration} />
                                                                                    <InfoTile label="Technique" value={exercise.technique} />
                                                                                    <InfoTile label="Machine" value={exercise.machine} />
                                                                                    <InfoTile label="Intensity" value={exercise.intensity} />
                                                                                    <InfoTile label="Notes" value={exercise.notes} />
                                                                                </div> */}

                                                                                {/* Session Table */}
                                                                                {exercise.sessions?.length > 0 && (
                                                                                    <div className="pd-session-list mt-3">
                                                                                        {exercise.sessions?.map((session, sIdx) => (
                                                                                            <div className="pd-session-card" key={sIdx}>

                                                                                                <div className="pd-session-left">
                                                                                                    {/* <div className="pd-session-number">
                                                                                                        {session.sessionNo}
                                                                                                    </div> */}

                                                                                                    <div>
                                                                                                        <h5>Session {session.sessionNo}</h5>
                                                                                                        <p>{session.date}</p>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span
                                                                                                            className={`pd-session-pill ${session.status === "Completed"
                                                                                                                ? "completed"
                                                                                                                : "pending"
                                                                                                                } ms-2 mx-2`}
                                                                                                        >
                                                                                                            {session.status}
                                                                                                        </span>

                                                                                                        <span
                                                                                                            className={`pd-session-pill ${session.paymentStatus === "Paid"
                                                                                                                ? "paid"
                                                                                                                : "unpaid"
                                                                                                                }`}
                                                                                                        >
                                                                                                            {session.paymentStatus}
                                                                                                        </span>
                                                                                                    </div>

                                                                                                </div>


                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}

                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

/* ── SMALL REUSABLE COMPONENTS ── */

const SummaryTile = ({ icon: Icon, label, value, accent }) => (
    <div className={`pd-summary-tile pd-accent-${accent}`}>
        <div className="pd-summary-tile-icon">
            <Icon size={20} />
        </div>
        <div className="pd-summary-tile-body">
            <span className="pd-summary-tile-label">{label}</span>
            <span className="pd-summary-tile-value">{value}</span>
        </div>
    </div>
);

const InfoTile = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="pd-info-tile">
            <span className="pd-info-label">{label}</span>
            <span className="pd-info-value">{value}</span>
        </div>
    );
};

export default PaymentDetails;