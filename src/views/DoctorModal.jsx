import React from 'react';
import { CModal, CModalHeader, CModalTitle, CModalBody } from '@coreui/react';
import {
    User, Award, Briefcase, Phone, Mail, Building2,
    Calendar, Clock, MapPin, FileText, Stethoscope,
    BadgeCheck, Star, Languages, Target
} from 'lucide-react';

const DoctorModal = ({ visible, onClose, doctor, doctorAvatar }) => {
    if (!doctor) return null;

    const InfoRow = ({ icon: Icon, label, value, color = 'var(--c-navy)' }) => {
        if (!value) return null;
        return (
            <div className="app-info-item" style={{ flexDirection: 'column', gap: 4 }}>
                <p className="app-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={10} style={{ color }} />
                    {label}
                </p>
                <p className="app-info-value">{value}</p>
            </div>
        );
    };

    const TagList = ({ icon: Icon, label, items }) => {
        if (!items || !items.length) return null;
        return (
            <div style={{ gridColumn: '1 / -1' }}>
                <p className="app-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <Icon size={10} style={{ color: 'var(--c-navy)' }} />
                    {label}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {items.map((item, i) => (
                        <span key={i} className="app-status-pill" style={{
                            background: 'var(--c-navy-xlight)',
                            color: 'var(--c-navy)',
                            border: '1px solid var(--c-navy-light)',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                        }}>
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <CModal visible={visible} onClose={onClose} alignment="center" size="lg" backdrop="static" className='premium-modal'>
            <CModalHeader className='premium-modal-header' style={{ border: 'none', padding: '16px 20px 0' }}>
                <CModalTitle>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--c-text)' }}>
                        Doctor Details
                    </span>
                </CModalTitle>
            </CModalHeader>

            <CModalBody style={{ padding: '0 0 8px' }}>

                {/* ── Banner ── */}
                <div style={{
                    background: 'var(--g-navy)',
                    padding: '24px 20px 48px',
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'center',
                    margin: '12px 0 0',
                }}>
                    {/* bg glow */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: 'radial-gradient(circle at 80% 30%, rgba(249,115,22,.22) 0%, transparent 55%)',
                    }} />

                    {/* Avatar */}
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                        <img
                            src={doctorAvatar}
                            alt={doctor.doctorName}
                            style={{
                                width: 88, height: 88,
                                borderRadius: 20,
                                objectFit: 'cover',
                                border: '3px solid rgba(255,255,255,.3)',
                                boxShadow: '0 8px 24px rgba(0,0,0,.25)',
                                position: 'relative', zIndex: 1,
                            }}
                        />
                        {doctor.doctorAvailabilityStatus && (
                            <span style={{
                                position: 'absolute', bottom: 4, right: 4,
                                width: 14, height: 14,
                                background: 'var(--c-success)',
                                border: '2px solid #fff',
                                borderRadius: '50%',
                                zIndex: 2,
                            }} />
                        )}
                    </div>

                    <h5 style={{
                        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
                        color: '#fff', margin: '0 0 4px', position: 'relative', zIndex: 1,
                    }}>
                        {doctor.doctorName}
                    </h5>

                    <p style={{
                        fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600,
                        margin: '0 0 12px', position: 'relative', zIndex: 1,
                    }}>
                        {doctor.specialization}
                    </p>

                    {/* quick badges */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1,
                    }}>
                        {doctor.experience && (
                            <span className="app-doc-exp-badge">
                                <Briefcase size={11} /> {doctor.experience} Yrs Exp
                            </span>
                        )}
                        {doctor.qualification && (
                            <span style={{
                                background: 'rgba(255,255,255,.15)',
                                border: '1px solid rgba(255,255,255,.25)',
                                color: '#fff',
                                borderRadius: 9999,
                                padding: '4px 12px',
                                fontSize: 11, fontWeight: 700,
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}>
                                <Award size={11} /> {doctor.qualification}
                            </span>
                        )}
                        {doctor.doctorAvailabilityStatus && (
                            <span className="app-status-pill app-status-confirmed">
                                <span className="app-status-dot" /> Available
                            </span>
                        )}

                        {
                            doctor.dateofJoining && (
                                <span className="app-status-pill app-status-confirmed">
                                    <span className="app-status-dot" /> Joined : {doctor.dateofJoining}
                                </span>
                            )
                        }
                    </div>

                    {/* curved bottom */}
                    <div style={{
                        position: 'absolute', bottom: -1, left: 0, right: 0,
                        height: 28, background: 'var(--c-surface)',
                        borderRadius: '28px 28px 0 0',
                    }} />
                </div>

                {/* ── Content ── */}
                <div style={{ padding: '8px 20px 16px' }}>

                    {/* About */}
                    {doctor.profileDescription && (
                        <div className="app-payment-box" style={{ marginBottom: 16, marginTop: 4 }}>
                            <p className="app-payment-title">
                                <FileText size={12} /> About
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0, lineHeight: 1.6 }}>
                                {doctor.profileDescription}
                            </p>
                        </div>
                    )}

                    {/* Info grid */}
                    <div className="app-info-grid" style={{ marginBottom: 12 }}>
                        <InfoRow icon={BadgeCheck} label="Doctor ID" value={doctor.doctorId} />
                        <InfoRow icon={Award} label="License" value={doctor.doctorLicence} />
                        <InfoRow icon={User} label="Gender" value={doctor.gender} />
                        <InfoRow icon={Phone} label="Mobile" value={doctor.doctorMobileNumber} />
                        {/* <InfoRow icon={Mail} label="Email" value={doctor.doctorEmail} /> */}
                        <InfoRow icon={Building2} label="Hospital" value={doctor.hospitalName} />
                        <InfoRow
                            icon={MapPin}
                            label="Branches"
                            value={
                                doctor?.branches
                                    ?.map(branch => branch.branchName)
                                    .join(', ')
                            }
                        />
                        <InfoRow icon={Calendar} label="Available Days" value={doctor.availableDays} />
                        <InfoRow icon={Clock} label="Available Time" value={doctor.availableTimes} />
                        <InfoRow icon={MapPin} label="Address" value={doctor.address} />
                        <InfoRow icon={Stethoscope} label="Area of Expertise" value={doctor.areaOfExpertise} />
                    </div>

                    {/* Tags */}
                    <div className="app-info-grid">
                        <TagList icon={Target} label="Focus Areas" items={doctor.focusAreas} />
                        <TagList icon={Languages} label="Languages" items={doctor.languages} />
                        <TagList icon={Star} label="Highlights" items={doctor.highlights} />
                    </div>

                    {/* Fees */}
                    {doctor.doctorFees && (
                        <div className="app-payment-box" style={{ marginTop: 12 }}>
                            <p className="app-payment-title">
                                <Briefcase size={12} /> Consultation Fees
                            </p>
                            <div className="app-payment-row">
                                <span style={{ color: 'var(--c-text-2)', fontSize: 13 }}>In-Clinic</span>
                                <span style={{ fontWeight: 700, color: 'var(--c-navy)', fontSize: 13 }}>
                                    ₹{doctor.doctorFees.inClinicFee}
                                </span>
                            </div>
                            {/* <div className="app-payment-row">
                                <span style={{ color: 'var(--c-text-2)', fontSize: 13 }}>Video Consultation</span>
                                <span style={{ fontWeight: 700, color: 'var(--c-navy)', fontSize: 13 }}>
                                    {doctor.doctorFees.vedioConsultationFee > 0
                                        ? `₹${doctor.doctorFees.vedioConsultationFee}`
                                        : 'Free'}
                                </span>
                            </div> */}
                        </div>
                    )}

                    {/* Signature */}
                    {/* {doctor.doctorSignature && (
                        <div style={{ marginTop: 12 }}>
                            <p className="app-info-label" style={{ marginBottom: 6 }}>Doctor Signature</p>
                            <div style={{
                                background: 'var(--c-surface-2)',
                                border: '1px solid var(--c-border)',
                                borderRadius: 'var(--r-sm)',
                                padding: 12,
                                display: 'flex',
                                justifyContent: 'center',
                            }}>
                                <img
                                    src={doctor.doctorSignature}
                                    alt="Signature"
                                    style={{ maxHeight: 60, objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    )} */}

                </div>
            </CModalBody>
        </CModal>
    );
};

export default DoctorModal;