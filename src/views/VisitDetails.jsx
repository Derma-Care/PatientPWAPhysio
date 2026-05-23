import React, { useState } from 'react';
import {
    User,
    Calendar,
    AlertTriangle,
    Stethoscope,
    ClipboardList,
    HeartPulse,
    Dumbbell,
    ChevronDown,
    CheckCircle2,
    FileText,
    StickyNote,
    ArrowLeft,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/VisitDetails.css';
import TherapySessions from './Therapysessions';

// replace the old therapy sessions section with:

const SECTION_META = {
    patient: { icon: User, accent: 'navy', label: 'Patient Information' },
    complaints: { icon: AlertTriangle, accent: 'orange', label: 'Complaints' },
    diagnosis: { icon: Stethoscope, accent: 'navy', label: 'Diagnosis' },
    treatment: { icon: ClipboardList, accent: 'orange', label: 'Treatment Plan' },
    therapy: { icon: HeartPulse, accent: 'navy', label: 'Therapy Sessions' },
    home: { icon: Dumbbell, accent: 'orange', label: 'Home Exercises' },
    followup: { icon: Calendar, accent: 'navy', label: 'Follow Up' },
    assessment: {
        icon: ClipboardList,
        accent: 'navy',
        label: 'Assessment'
    },
    //need investigations
};

const AccordionSection = ({ sectionKey, children, badge }) => {
    const [open, setOpen] = useState(true);
    const { icon: Icon, accent, label } = SECTION_META[sectionKey];

    return (
        <div className="app-card vd-accordion">
            <button
                className={`vd-acc-trigger vd-acc-trigger--${accent}`}
                onClick={() => setOpen(p => !p)}
                aria-expanded={open}
            >
                <span className="vd-acc-left">
                    <span className={`vd-acc-iconbox vd-acc-iconbox--${accent}`}>
                        <Icon size={15} />
                    </span>
                    <span className="vd-acc-label">{label}</span>
                    {badge != null && (
                        <span className={`vd-acc-badge vd-acc-badge--${accent}`}>
                            {badge}
                        </span>
                    )}
                </span>
                <ChevronDown
                    size={16}
                    className={`vd-acc-chevron ${open ? 'vd-acc-chevron--open' : ''}`}
                />
            </button>

            <div className={`vd-acc-body ${open ? 'vd-acc-body--open' : ''}`}>
                <div className="vd-acc-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

const renderField = (label, value) => {
    if (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
    ) return null;

    return (
        <div className="app-info-card">
            <div className="app-info-label">{label}</div>
            <div className="app-info-value">
                {Array.isArray(value) ? value.join(', ') : String(value)}
            </div>
        </div>
    );
};

const VisitDetails = () => {
    const location = useLocation();
    const visit = location.state?.visit;
    const data = visit?.physiotherapyDoctorData;
    const navigate = useNavigate();
    if (!data) return null;

    const therapyCount = data.therapySessions?.reduce(
        (acc, s) => acc + (s.therapyData?.length ?? 0), 0
    ) ?? 0;
    const homeExCount = data.exercisePlan?.homeExercises?.length ?? 0;
    const ComplaintCard = ({ complaints }) => {

        const chips = [
            complaints?.duration && {
                label: 'Duration',
                val: complaints.duration
            },
            complaints?.activityLevels && {
                label: 'Activity',
                val: complaints.activityLevels
            },
        ].filter(Boolean);

        const gridFields = [
            complaints?.previousInjuries && {
                label: 'Previous Injuries',
                val: complaints.previousInjuries
            },
            complaints?.currentMedications && {
                label: 'Current Medications',
                val: complaints.currentMedications
            },
            complaints?.allergies && {
                label: 'Allergies',
                val: complaints.allergies
            },
            complaints?.occupation && {
                label: 'Occupation',
                val: complaints.occupation
            },

        ].filter(Boolean);

        return (
            <div className="vd-ex-card">

                {/* Header */}
                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <FileText size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                Complaint Details
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chips */}
                {chips.length > 0 && (
                    <div className="vd-ex-chips">
                        {chips.map((c, i) => (
                            <div key={i} className="vd-ex-chip">
                                <span className="vd-ex-chip-label">{c.label}</span>
                                <span className="vd-ex-chip-val">{c.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Complaint Notes */}
                {complaints?.complaintDetails && (
                    <div className="vd-ex-notes">
                        <StickyNote size={13} />
                        <span>{complaints.complaintDetails}</span>
                    </div>
                )}

                {/* Complaint Attachment */}
                {complaints?.complaintImage && (
                    <div className="mt-3">
                        <img
                            src={complaints.complaintImage}
                            alt="Complaint"
                            className="img-fluid rounded"
                            style={{
                                maxHeight: 250,
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb'
                            }}
                        />
                    </div>
                )}

                {/* Complaint PDF / Document */}
                {complaints?.complaintDocument && (
                    <div className="vd-ex-video">
                        <a
                            href={complaints.complaintDocument}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                        >
                            View Document
                        </a>
                    </div>
                )}

                {/* Grid Fields */}
                {gridFields.length > 0 && (
                    <div className="vd-ex-grid">
                        {gridFields.map((f, i) => (
                            <div
                                key={i}
                                className="vd-ex-cell"
                            >
                                <div className="vd-ex-cell-label">
                                    {f.label}
                                </div>

                                <div className="vd-ex-cell-val">
                                    {f.val}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const DiagnosisCard = ({ diagnosis }) => {

        const chips = [
            diagnosis?.severity && {
                label: 'Severity',
                val: diagnosis.severity
            },
            diagnosis?.stage && {
                label: 'Stage',
                val: diagnosis.stage
            },
        ].filter(Boolean);

        const gridFields = [
            diagnosis?.physioDiagnosis && {
                label: 'Physio Diagnosis',
                val: diagnosis.physioDiagnosis
            },
            diagnosis?.differentialDiagnosis && {
                label: 'Differential Diagnosis',
                val: diagnosis.differentialDiagnosis
            },
            diagnosis?.affectedArea && {
                label: 'Affected Area',
                val: diagnosis.affectedArea
            },
        ].filter(Boolean);

        return (
            <div className="vd-ex-card">

                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <Stethoscope size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                Diagnosis Details
                            </div>
                        </div>
                    </div>
                </div>

                {chips.length > 0 && (
                    <div className="vd-ex-chips">
                        {chips.map((c, i) => (
                            <div key={i} className="vd-ex-chip">
                                <span className="vd-ex-chip-label">{c.label}</span>
                                <span className="vd-ex-chip-val">{c.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {diagnosis?.notes && (
                    <div className="vd-ex-notes">
                        <StickyNote size={13} />
                        <span>{diagnosis.notes}</span>
                    </div>
                )}

                {gridFields.length > 0 && (
                    <div className="vd-ex-grid">
                        {gridFields.map((f, i) => (
                            <div key={i} className="vd-ex-cell">
                                <div className="vd-ex-cell-label">{f.label}</div>
                                <div className="vd-ex-cell-val">{f.val}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const TreatmentPlanCard = ({ treatmentPlan }) => {

        const gridFields = [
            treatmentPlan?.doctorName && {
                label: 'Doctor Name',
                val: treatmentPlan.doctorName
            },
            treatmentPlan?.therapistName && {
                label: 'Therapist Name',
                val: treatmentPlan.therapistName
            },
            treatmentPlan?.manualTherapy && {
                label: 'Manual Therapy',
                val: treatmentPlan.manualTherapy
            },
            treatmentPlan?.patientResponse && {
                label: 'Patient Response',
                val: treatmentPlan.patientResponse
            },
            treatmentPlan?.precautions && {
                label: 'Precautions',
                val: treatmentPlan.precautions,
                full: true
            },
        ].filter(Boolean);

        return (
            <div className="vd-ex-card">

                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <ClipboardList size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                Treatment Plan
                            </div>
                        </div>
                    </div>
                </div>

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
            </div>
        );
    };

    const HomeExerciseCard = ({ exercise }) => {

        const chips = [
            exercise?.frequency && {
                label: 'Frequency',
                val: exercise.frequency
            },
            exercise?.duration && {
                label: 'Duration',
                val: exercise.duration
            },
        ].filter(Boolean);

        const gridFields = [
            exercise?.sets && {
                label: 'Sets',
                val: exercise.sets
            },
            exercise?.reps && {
                label: 'Reps',
                val: exercise.reps
            },
            exercise?.session && {
                label: 'Session',
                val: exercise.session
            },
        ].filter(Boolean);

        return (
            <div className="vd-ex-card">

                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <Dumbbell size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                {exercise?.name || 'Exercise'}
                            </div>
                        </div>
                    </div>
                </div>

                {chips.length > 0 && (
                    <div className="vd-ex-chips">
                        {chips.map((c, i) => (
                            <div key={i} className="vd-ex-chip">
                                <span className="vd-ex-chip-label">{c.label}</span>
                                <span className="vd-ex-chip-val">{c.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {exercise?.instructions && (
                    <div className="vd-ex-notes">
                        <StickyNote size={13} />
                        <span>{exercise.instructions}</span>
                    </div>
                )}

                {gridFields.length > 0 && (
                    <div className="vd-ex-grid">
                        {gridFields.map((f, i) => (
                            <div key={i} className="vd-ex-cell">
                                <div className="vd-ex-cell-label">{f.label}</div>
                                <div className="vd-ex-cell-val">{f.val}</div>
                            </div>
                        ))}
                    </div>
                )}

                {exercise?.videoUrl && (
                    <div className="vd-ex-video">
                        <video
                            src={exercise.videoUrl}
                            controls
                            className="w-100 rounded mt-2"
                            style={{ maxHeight: 250 }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const FollowUpCard = ({ followUp }) => {

        const gridFields = [
            followUp?.nextVisitDate && {
                label: 'Next Visit Date',
                val: followUp.nextVisitDate
            },
            followUp?.reviewNotes && {
                label: 'Review Notes',
                val: followUp.reviewNotes
            },
            followUp?.modifications && {
                label: 'Modifications',
                val: followUp.modifications,
                full: true
            },
        ].filter(Boolean);

        return (
            <div className="vd-ex-card">

                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <Calendar size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                Follow Up Details
                            </div>
                        </div>
                    </div>
                </div>

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
            </div>
        );
    };
    const AssessmentCard = ({ assessment }) => {

        const subjective = assessment?.subjectiveAssessment || {};
        const functional = assessment?.functionalAssessment || {};
        const physical = assessment?.physicalExamination || {};
        const redFlags = assessment?.redFlags || {};
        const radiation = assessment?.radiationNeuro || {};
        const psychosocial = assessment?.psychosocial || {};
        const symptoms = assessment?.specialSymptoms || {};

        const yesFlags = Object.entries(redFlags)
            ?.filter(([_, value]) => value === true)
            ?.map(([key]) => key);

        const radiationFlags = Object.entries(radiation)
            ?.filter(([_, value]) => value === true)
            ?.map(([key]) => key);

        const symptomFlags = Object.entries(symptoms)
            ?.filter(([_, value]) => value === true)
            ?.map(([key]) => key);

        return (
            <div className="vd-ex-card">

                {/* Header */}
                <div className="vd-ex-header">
                    <div className="vd-ex-header-left">
                        <div className="vd-ex-icon">
                            <ClipboardList size={18} />
                        </div>

                        <div>
                            <div className="vd-ex-name">
                                Assessment Details
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chips */}
                <div className="vd-ex-chips">

                    {subjective?.painScale > 0 && (
                        <div className="vd-ex-chip">
                            <span className="vd-ex-chip-label">Pain Scale</span>
                            <span className="vd-ex-chip-val">
                                {subjective.painScale}/10
                            </span>
                        </div>
                    )}

                    {subjective?.painType && (
                        <div className="vd-ex-chip">
                            <span className="vd-ex-chip-label">Pain Type</span>
                            <span className="vd-ex-chip-val">
                                {subjective.painType}
                            </span>
                        </div>
                    )}

                    {subjective?.duration && (
                        <div className="vd-ex-chip">
                            <span className="vd-ex-chip-label">Duration</span>
                            <span className="vd-ex-chip-val">
                                {subjective.duration}
                            </span>
                        </div>
                    )}

                </div>

                {/* Notes */}
                {subjective?.chiefComplaint && (
                    <div className="vd-ex-notes">
                        <StickyNote size={13} />
                        <span>{subjective.chiefComplaint}</span>
                    </div>
                )}

                {/* Grid */}
                <div className="vd-ex-grid">

                    {subjective?.onset && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">Onset</div>
                            <div className="vd-ex-cell-val">
                                {subjective.onset}
                            </div>
                        </div>
                    )}

                    {subjective?.aggravatingFactors && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Aggravating Factors
                            </div>
                            <div className="vd-ex-cell-val">
                                {subjective.aggravatingFactors}
                            </div>
                        </div>
                    )}

                    {subjective?.relievingFactors && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Relieving Factors
                            </div>
                            <div className="vd-ex-cell-val">
                                {subjective.relievingFactors}
                            </div>
                        </div>
                    )}

                    {subjective?.observations && (
                        <div className="vd-ex-cell vd-ex-cell--full">
                            <div className="vd-ex-cell-label">
                                Observations
                            </div>
                            <div className="vd-ex-cell-val">
                                {subjective.observations}
                            </div>
                        </div>
                    )}

                    {functional?.difficultiesIn?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Difficulties In
                            </div>
                            <div className="vd-ex-cell-val">
                                {functional.difficultiesIn.join(', ')}
                            </div>
                        </div>
                    )}

                    {physical?.postureAssessment?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Posture Assessment
                            </div>
                            <div className="vd-ex-cell-val">
                                {physical.postureAssessment.join(', ')}
                            </div>
                        </div>
                    )}

                    {physical?.rangeOfMotion?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Range Of Motion
                            </div>
                            <div className="vd-ex-cell-val">
                                {physical.rangeOfMotion.join(', ')}
                            </div>
                        </div>
                    )}

                    {physical?.muscleStrength?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Muscle Strength
                            </div>
                            <div className="vd-ex-cell-val">
                                {physical.muscleStrength.join(', ')}
                            </div>
                        </div>
                    )}

                    {physical?.neurologicalSigns?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Neurological Signs
                            </div>
                            <div className="vd-ex-cell-val">
                                {physical.neurologicalSigns.join(', ')}
                            </div>
                        </div>
                    )}

                    {yesFlags?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Red Flags
                            </div>
                            <div className="vd-ex-cell-val">
                                {yesFlags.join(', ')}
                            </div>
                        </div>
                    )}

                    {radiationFlags?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Radiation / Neuro
                            </div>
                            <div className="vd-ex-cell-val">
                                {radiationFlags.join(', ')}
                            </div>
                        </div>
                    )}

                    {psychosocial?.stressLevel && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Stress Level
                            </div>
                            <div className="vd-ex-cell-val">
                                {psychosocial.stressLevel}
                            </div>
                        </div>
                    )}

                    {symptomFlags?.length > 0 && (
                        <div className="vd-ex-cell">
                            <div className="vd-ex-cell-label">
                                Special Symptoms
                            </div>
                            <div className="vd-ex-cell-val">
                                {symptomFlags.join(', ')}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        );
    };
    return (
        <div className=" app-page">

            {/* VISIT HEADER */}

            <div className="app-hero">
                <div className="app-hero-inner">
                    <button className="app-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} /> Back to Bookings
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="app-hero-title">{visit.visitNumber}</h1>
                            <div className="vd-hero-meta">
                                <span className="vd-hero-date">
                                    <Calendar size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
                                    {visit.visitDate}
                                </span>
                                <span className="vd-hero-sep">·</span>
                                <span className="vd-hero-time">{visit.visitTime}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <div className='container'>
                {/* PATIENT INFO */}
                <AccordionSection sectionKey="patient"  >
                    <div >

                        {/* Header */}
                        <div className="vd-ex-header">
                            <div className="vd-ex-header-left">
                                <div className="vd-ex-icon">
                                    <User size={18} />
                                </div>

                                <div>
                                    <div className="vd-ex-name">
                                        {data.patientInfo?.patientName || 'Patient Details'}
                                    </div>

                                    {data.patientInfo?.patientId && (
                                        <div className="vd-ex-id">
                                            {data.patientInfo?.patientId}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Chips */}
                        <div className="vd-ex-chips">
                            {data.patientInfo?.age && (
                                <div className="vd-ex-chip">
                                    <span className="vd-ex-chip-label">Age</span>
                                    <span className="vd-ex-chip-val">
                                        {data.patientInfo?.age}
                                    </span>
                                </div>
                            )}

                            {data.patientInfo?.sex && (
                                <div className="vd-ex-chip">
                                    <span className="vd-ex-chip-label">Gender</span>
                                    <span className="vd-ex-chip-val">
                                        {data.patientInfo?.sex}
                                    </span>
                                </div>
                            )}
                            {data.patientInfo?.mobileNumber && (
                                <div className="vd-ex-chip">
                                    <span className="vd-ex-chip-label">Mobile Number</span>
                                    <span className="vd-ex-chip-val">
                                        {data.patientInfo?.mobileNumber}
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                </AccordionSection>

                {/* COMPLAINTS */}
                <AccordionSection sectionKey="complaints">
                    <ComplaintCard complaints={data.complaints} />
                </AccordionSection>
                <AccordionSection sectionKey="assessment">
                    <AssessmentCard assessment={data.assessment} />
                </AccordionSection>
                {/* DIAGNOSIS */}
                <AccordionSection sectionKey="diagnosis">
                    <DiagnosisCard diagnosis={data.diagnosis} />
                </AccordionSection>

                {/* TREATMENT PLAN */}
                <AccordionSection sectionKey="treatment">
                    <TreatmentPlanCard treatmentPlan={data.treatmentPlan} />
                </AccordionSection>



                {/* THERAPY SESSIONS */}

                <AccordionSection sectionKey="therapy" badge={therapyCount || undefined}>
                    <TherapySessions therapySessions={data.therapySessions} />
                </AccordionSection>

                {/* HOME EXERCISES */}
                <AccordionSection sectionKey="home" badge={homeExCount || undefined}>
                    {data.exercisePlan?.homeExercises?.map((exercise, idx) => (
                        <HomeExerciseCard key={idx} exercise={exercise} />
                    ))}
                </AccordionSection>

                {/* FOLLOW UP */}
                <AccordionSection sectionKey="followup">
                    <FollowUpCard followUp={data.followUp} />
                </AccordionSection>
            </div>
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="app-info-item">
        <div className="app-info-label">{label}</div>
        <div className="app-info-value">{value || 'N/A'}</div>
    </div>
);

export default VisitDetails;