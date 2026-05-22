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
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

    if (!data) return null;

    const therapyCount = data.therapySessions?.reduce(
        (acc, s) => acc + (s.therapyData?.length ?? 0), 0
    ) ?? 0;
    const homeExCount = data.exercisePlan?.homeExercises?.length ?? 0;

    return (
        <div className="container py-3 app-page">

            {/* VISIT HEADER */}
            <div className="vd-hero mb-3">
                <div className="vd-hero-inner">
                    <div className="vd-hero-left">
                        <div className="vd-hero-visit-num">{visit.visitNumber}</div>
                        <div className="vd-hero-meta">
                            <span className="vd-hero-date">
                                <Calendar size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
                                {visit.visitDate}
                            </span>
                            <span className="vd-hero-sep">·</span>
                            <span className="vd-hero-time">{visit.visitTime}</span>
                        </div>
                    </div>
                    <div className="app-status-pill app-status-completed">
                        <CheckCircle2 size={12} />
                        Completed
                    </div>
                </div>
            </div>

            {/* PATIENT INFO */}
            <AccordionSection sectionKey="patient">
                <div className="app-grid">
                    {renderField('Patient Name', data.patientInfo?.patientName)}
                    {renderField('Patient ID', data.patientInfo?.patientId)}
                    {renderField('Age', data.patientInfo?.age)}
                    {renderField('Gender', data.patientInfo?.sex)}
                    {renderField('Mobile', data.patientInfo?.mobileNumber)}
                </div>
            </AccordionSection>

            {/* COMPLAINTS */}
            <AccordionSection sectionKey="complaints">
                <div className="app-grid">
                    {renderField('Complaint Details', data.complaints?.complaintDetails)}
                    {renderField('Duration', data.complaints?.duration)}
                    {renderField('Previous Injuries', data.complaints?.previousInjuries)}
                    {renderField('Current Medications', data.complaints?.currentMedications)}
                    {renderField('Allergies', data.complaints?.allergies)}
                    {renderField('Occupation', data.complaints?.occupation)}
                    {renderField('Activity Levels', data.complaints?.activityLevels)}
                </div>
            </AccordionSection>

            {/* DIAGNOSIS */}
            <AccordionSection sectionKey="diagnosis">
                <div className="app-grid">
                    {renderField('Physio Diagnosis', data.diagnosis?.physioDiagnosis)}
                    {renderField('Differential Diagnosis', data.diagnosis?.differentialDiagnosis)}
                    {renderField('Affected Area', data.diagnosis?.affectedArea)}
                    {renderField('Severity', data.diagnosis?.severity)}
                    {renderField('Stage', data.diagnosis?.stage)}
                    {renderField('Notes', data.diagnosis?.notes)}
                </div>
            </AccordionSection>

            {/* TREATMENT PLAN */}
            <AccordionSection sectionKey="treatment">
                <div className="app-grid">
                    {renderField('Doctor Name', data.treatmentPlan?.doctorName)}
                    {renderField('Therapist Name', data.treatmentPlan?.therapistName)}
                    {renderField('Manual Therapy', data.treatmentPlan?.manualTherapy)}
                    {renderField('Patient Response', data.treatmentPlan?.patientResponse)}
                    {renderField('Precautions', data.treatmentPlan?.precautions)}
                </div>
            </AccordionSection>

            {/* THERAPY SESSIONS */}

            <AccordionSection sectionKey="therapy" badge={therapyCount || undefined}>
                <TherapySessions therapySessions={data.therapySessions} />
            </AccordionSection>
            {/* HOME EXERCISES */}
            <AccordionSection sectionKey="home" badge={homeExCount || undefined}>
                {data.exercisePlan?.homeExercises?.map((exercise, idx) => (
                    <div key={idx} className="app-exercise-card">
                        <h6 className="mb-3">{exercise.name}</h6>
                        <div className="app-grid">
                            {renderField('Sets', exercise.sets)}
                            {renderField('Reps', exercise.reps)}
                            {renderField('Duration', exercise.duration)}
                            {renderField('Frequency', exercise.frequency)}
                            {renderField('Instructions', exercise.instructions)}
                            {renderField('Session', exercise.session)}
                        </div>
                        {exercise.videoUrl && (
                            <video
                                src={exercise.videoUrl}
                                controls
                                className="w-100 rounded mt-3"
                                style={{ maxHeight: 250 }}
                            />
                        )}
                    </div>
                ))}
            </AccordionSection>

            {/* FOLLOW UP */}
            <AccordionSection sectionKey="followup">
                <div className="app-grid">
                    {renderField('Next Visit Date', data.followUp?.nextVisitDate)}
                    {renderField('Review Notes', data.followUp?.reviewNotes)}
                    {renderField('Modifications', data.followUp?.modifications)}
                </div>
            </AccordionSection>

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