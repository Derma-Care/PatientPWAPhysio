import React from 'react';
import {
    HeartPulse,
    Brain,
    Dumbbell,
    RotateCcw,
    Activity,
    Zap,
    Timer,
    Repeat2,
    ScanLine,
    StickyNote,
    ChevronRight,
} from 'lucide-react';
import '../styles/TherapySession.css';
const activityIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('neuro') || t.includes('brain')) return <Brain size={15} />;
    if (t.includes('electro')) return <Zap size={15} />;
    if (t.includes('rotation') || t.includes('rotat')) return <RotateCcw size={15} />;
    if (t.includes('manual')) return <Activity size={15} />;
    return <Dumbbell size={15} />;
};

const ExerciseCard = ({ exercise }) => {
    const {
        exerciseName, exerciseId, bodyPart, activityType,
        activityDuration, frequency, sets, repetitions,
        technique, machine, intensity, notes,
        pricePerSession, discountPercentage, gst, totalExercisePrice, totalPrice,
        youtubeUrl,
    } = exercise;

    const chips = [
        bodyPart && { icon: <ScanLine size={12} />, label: 'Body', val: bodyPart },
        activityType && { icon: <Activity size={12} />, label: 'Type', val: activityType },
        activityDuration && { icon: <Timer size={12} />, label: 'Duration', val: activityDuration },
        frequency && { icon: <Repeat2 size={12} />, label: 'Frequency', val: frequency },
    ].filter(Boolean);

    const gridFields = [
        sets && { label: 'Sets', val: sets },
        repetitions && { label: 'Reps', val: repetitions },
        technique && { label: 'Technique', val: technique, full: true },
        machine && { label: 'Machine', val: machine },
        intensity && { label: 'Intensity', val: intensity },
    ].filter(Boolean);

    return (
        <div className="vd-ex-card">

            {/* Header */}
            <div className="vd-ex-header">
                <div className="vd-ex-header-left">
                    <div className="vd-ex-icon">
                        {activityIcon(activityType)}
                    </div>
                    <div>
                        <div className="vd-ex-name">{exerciseName}</div>
                        {exerciseId && <div className="vd-ex-id">{exerciseId}</div>}
                    </div>
                </div>
                {/* <div className="vd-ex-total-price">₹{totalPrice ?? totalExercisePrice}</div> */}
            </div>

            {/* Chips */}
            {chips.length > 0 && (
                <div className="vd-ex-chips">
                    {chips.map((c, i) => (
                        <div key={i} className="vd-ex-chip">
                            <span className="vd-ex-chip-icon">{c.icon}</span>
                            <span className="vd-ex-chip-label">{c.label}</span>
                            <span className="vd-ex-chip-val">{c.val}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Grid fields */}
            {gridFields.length > 0 && (
                <div className="vd-ex-grid">
                    {gridFields.map((f, i) => (
                        <div
                            key={i}
                            className={`vd-ex-cell ${f.full ? 'vd-ex-cell--full' : ''}`}
                        >
                            <div className="vd-ex-cell-label">{f.label}</div>
                            <div className="vd-ex-cell-val">{f.val}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Notes */}
            {notes && (
                <div className="vd-ex-notes">
                    <StickyNote size={13} />
                    <span>{notes}</span>
                </div>
            )}

            {/* Pricing footer */}
            {/* <div className="vd-ex-pricing">
                <div className="vd-ex-price-cell">
                    <div className="vd-ex-price-label">Per Session</div>
                    <div className="vd-ex-price-val">₹{pricePerSession}</div>
                </div>
                <div className="vd-ex-price-cell">
                    <div className="vd-ex-price-label">Discount / GST</div>
                    <div className="vd-ex-price-val">{discountPercentage}% / {gst}%</div>
                </div>
                <div className="vd-ex-price-cell vd-ex-price-cell--total">
                    <div className="vd-ex-price-label">Total</div>
                    <div className="vd-ex-price-val">₹{totalExercisePrice}</div>
                </div>
            </div> */}

            {/* Video link */}
            {youtubeUrl && (
                <div className="vd-ex-video">
                    <a href={youtubeUrl} target="_blank" rel="noreferrer" className="btn btn-success btn-sm text-white">
                        Watch Exercise Video
                    </a>
                </div>
            )}
        </div>
    );
};

const TherapyBlock = ({ therapy, index }) => {
    const isOdd = index % 2 === 1;
    return (
        <div className="vd-therapy-block">
            <div className={`vd-therapy-header ${isOdd ? 'vd-therapy-header--orange' : 'vd-therapy-header--navy'}`}>
                <div className="vd-therapy-header-left">
                    <div className={`vd-therapy-icon ${isOdd ? 'vd-therapy-icon--orange' : 'vd-therapy-icon--navy'}`}>
                        <HeartPulse size={16} />
                    </div>
                    <div>
                        <div className="vd-therapy-name">{therapy.therapyName}</div>
                        <div className="vd-therapy-count">
                            {therapy.exercises?.length ?? 0} exercise{(therapy.exercises?.length ?? 0) !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                {/* <div className={`vd-therapy-price-pill ${isOdd ? 'vd-therapy-price-pill--orange' : 'vd-therapy-price-pill--navy'}`}>
                    ₹{therapy.totalTherapyPrice}
                </div> */}
            </div>

            <div className="vd-exercises-wrap">
                {therapy.exercises?.map((ex, i) => (
                    <ExerciseCard key={i} exercise={ex} />
                ))}
            </div>
        </div>
    );
};

const TherapySessions = ({ therapySessions = [] }) => {
    if (!therapySessions.length) return null;

    return (
        <div className="vd-sessions-root">
            {therapySessions.map((session, sIdx) => (
                <div key={sIdx} className="vd-session-block">

                    {/* Program Header */}
                    <div className="vd-prog-header">
                        <div className="vd-prog-header-inner">
                            <div className="vd-prog-glow" />
                            {/* <div className="vd-prog-label">Program</div> */}
                            <div className="vd-prog-name">{session.programName}</div>
                            {/* <div className="vd-prog-cost-row">
                                <span className="vd-prog-cost-label">Total Cost</span>
                                <span className="vd-prog-cost-val">₹{session.totalProgramCost}</span>
                            </div> */}
                        </div>
                    </div>

                    {/* Therapy blocks */}
                    {session.therapyData?.map((therapy, tIdx) => (
                        <TherapyBlock key={tIdx} therapy={therapy} index={tIdx} />
                    ))}

                </div>
            ))}
        </div>
    );
};

export default TherapySessions;