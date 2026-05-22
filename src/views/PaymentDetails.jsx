import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    ClipboardList
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

    return (
        <div className="pd-wrapper">

            {/* ── HERO HEADER ── */}
            <div className="pd-hero">
                <div className="pd-hero-left">
                    <span className="pd-hero-label">Payment Details</span>
                    <h2 className="pd-hero-booking">
                        #{paymentData.bookingId}
                    </h2>
                    <span className="pd-hero-sub">Booking Reference</span>
                </div>
                <div className="pd-hero-right">
                    <div className={`pd-status-badge ${paymentData.paymentStatus === 'Paid' ? 'paid' : paymentData.paymentStatus === 'Partial' ? 'partial' : 'unpaid'}`}>
                        <span className="pd-status-dot" />
                        {paymentData.paymentStatus}
                    </div>
                </div>
            </div>

            {/* ── SUMMARY STRIP ── */}
            <div className="pd-summary-strip">
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
                    <ClipboardList size={16} />
                    <span>Payment History</span>
                    <span className="pd-badge">{paymentData.paymentHistory?.length} Payments</span>
                </div>

                <div className="pd-table-wrap">
                    <table className="pd-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Type</th>
                                <th>Level</th>
                                <th>Date</th>
                                <th>Discount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentData.paymentHistory?.map((payment, index) => (
                                <tr key={index}>
                                    <td className="pd-table-idx">{index + 1}</td>
                                    <td className="pd-table-amount">₹{payment.amount}</td>
                                    <td>
                                        <span className="pd-mode-chip">{payment.paymentMode}</span>
                                    </td>
                                    <td>{payment.paymentType}</td>
                                    <td>{payment.paymentLevel}</td>
                                    <td className="pd-table-date">{payment.paymentDate}</td>
                                    <td>₹{payment.discountAmount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                                                <small className="text-muted">ID: {therapy.therapyId}</small>
                                                            </div>
                                                        </div>
                                                        <div className="pd-therapy-header-right">
                                                            <div className="pd-program-meta">
                                                                <span className="pd-meta-chip">{therapy.exercises?.length} Exercises</span>
                                                                <span className="pd-meta-chip success">{paidExercises} Paid</span>
                                                                <span className="pd-meta-chip danger">{therapy.exercises?.length - paidExercises} Pending</span>
                                                            </div>
                                                            <div className={`status-pill ${therapy.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                                                {therapy.paymentStatus}
                                                            </div>
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
                                                                                <div className={`status-pill ${exercise.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                                                                    {exercise.paymentStatus}
                                                                                </div>
                                                                                {isExerciseExpanded
                                                                                    ? <ChevronUp size={13} className="pd-chevron" />
                                                                                    : <ChevronDown size={13} className="pd-chevron" />
                                                                                }
                                                                            </div>
                                                                        </div>

                                                                        {/* Exercise Details */}
                                                                        {isExerciseExpanded && (
                                                                            <>
                                                                                <div className="pd-info-grid mt-2">
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
                                                                                </div>

                                                                                {/* Session Table */}
                                                                                {exercise.sessions?.length > 0 && (
                                                                                    <div className="pd-table-wrap mt-3">
                                                                                        <table className="pd-table pd-session-table">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th>Session</th>
                                                                                                    <th>Date</th>
                                                                                                    <th>Status</th>
                                                                                                    <th>Payment</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {exercise.sessions?.map((session, sIdx) => (
                                                                                                    <tr key={sIdx}>
                                                                                                        <td>Session {session.sessionNo}</td>
                                                                                                        <td>{session.date}</td>
                                                                                                        <td>
                                                                                                            <span className={`mini-pill ${session.status === 'Completed' ? 'paid' : 'warning'}`}>
                                                                                                                {session.status}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                        <td>
                                                                                                            <span className={`mini-pill ${session.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                                                                                                                {session.paymentStatus}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
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