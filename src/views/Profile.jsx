import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Calendar,
  Edit2, Save, Camera, ArrowLeft, Hash,
  Home, Building2, Navigation, Shield
} from 'lucide-react';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

// ─── Reusable field ──────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, value, name, editing, onChange }) => (
  <div className="app-info-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
    <p className="app-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
      {Icon && <Icon size={11} />} {label}
    </p>
    {editing ? (
      <input
        style={{
          background: 'var(--c-surface)',
          border: '1.5px solid var(--c-navy-light)',
          borderRadius: 'var(--r-sm)',
          padding: '7px 10px',
          fontSize: 13,
          fontFamily: 'var(--font-body)',
          color: 'var(--c-text)',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color .15s, box-shadow .15s',
        }}
        value={value ?? ''}
        name={name}
        onChange={e => onChange(name, e.target.value)}
        onFocus={e => { e.target.style.borderColor = 'var(--c-navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(27,79,138,.12)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--c-navy-light)'; e.target.style.boxShadow = 'none'; }}
      />
    ) : (
      <p className="app-info-value">{value || '—'}</p>
    )}
  </div>
);

// ─── Profile ─────────────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, draft, loading } = useAuth();
  // const [profile, setProfile] = useState(null);
  // const [draft, setDraft] = useState(null);
  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(
    () => localStorage.getItem('profilePicture')
  );
  const fileInputRef = useRef(null);



  const patch = (key, val) =>
    setDraft(d => ({ ...d, [key]: val }));

  const patchAddr = (key, val) =>
    setDraft(d => ({ ...d, address: { ...d.address, [key]: val } }));

  const handleFieldChange = (name, val) => {
    if (name.startsWith('address.')) {
      patchAddr(name.replace('address.', ''), val);
    } else {
      patch(name, val);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result;
      setPreviewImage(b64);
      localStorage.setItem('profilePicture', b64);
      toast.success('Photo Updated', 'Your profile picture has been saved.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.customerId) return;
    setSaving(true);
    try {
      await customerService.updateProfile(user.customerId, draft);
      setProfile(draft);
      setEditing(false);
      toast.success('Profile Updated', 'Your changes have been saved successfully.');
    } catch (err) {
      console.error('Profile update failed:', err);
      toast.error('Update Failed', err?.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-ring" />
        <p className="app-loading-text">Loading your profile…</p>
      </div>
    );
  }

  const addr = draft?.address ?? {};
  const avatarUrl =
    previewImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName ?? 'U')}&background=1B4F8A&color=fff&size=224`;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="app-page">
      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <button className="app-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="app-hero-title">My Profile</h1>
          <p className="app-hero-sub">Manage your personal information and account settings</p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="app-body" style={{ marginTop: -36 }}>

        {/* Two-column layout: avatar card + info card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}
          className="profile-layout">

          {/* ── Avatar / identity card ────────────────────────────────── */}
          <div className="app-card" style={{ overflow: 'visible' }}>
            <div className="app-card-body" style={{ textAlign: 'center', padding: '28px 24px' }}>

              {/* Avatar with camera button */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <img
                  src={avatarUrl}
                  alt={profile?.fullName}
                  style={{
                    width: 100, height: 100, borderRadius: 24,
                    objectFit: 'cover',
                    border: '4px solid var(--c-surface)',
                    boxShadow: '0 0 0 3px var(--c-navy-light), var(--s-md)',
                  }}
                />
                <input
                  type="file" ref={fileInputRef} accept="image/*"
                  style={{ display: 'none' }} onChange={handleFileChange}
                />
                <button
                  className="app-btn-navy"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    position: 'absolute', bottom: -8, right: -8,
                    width: 32, height: 32, padding: 0, borderRadius: '50%',
                    justifyContent: 'center', minWidth: 'unset',
                  }}
                  title="Change photo"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Name + ID */}
              <h2 style={{
                fontSize: 18, fontWeight: 800,
                margin: '0 0 4px', color: 'var(--c-text)',
              }}>
                {profile?.fullName}
              </h2>
              <p style={{
                fontSize: 12, color: 'var(--c-navy)', fontWeight: 700,
                background: 'var(--c-navy-xlight)', display: 'inline-block',
                padding: '2px 12px', borderRadius: 'var(--r-pill)', marginBottom: 14,
              }}>
                Patient ID: {profile?.patientId}
              </p>

              {/* Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <span className="app-booking-chip" style={{ background: 'var(--c-navy-xlight)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-light)' }}>
                  ★ Premium Member
                </span>
                <span className="app-booking-chip" style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', border: '1px solid #a7f3d0' }}>
                  ✓ Verified
                </span>
              </div>

              <hr className="app-divider" />

              {/* Meta rows */}
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--c-border-light)', fontSize: 13 }}>
                  <span style={{ color: 'var(--c-text-3)', fontWeight: 600 }}>Member since</span>
                  <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{memberSince}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--c-text-3)', fontWeight: 600 }}>Referral code</span>
                  <span style={{ fontWeight: 800, color: 'var(--c-navy)', fontFamily: 'monospace', letterSpacing: '.04em' }}>
                    {profile?.referralCode ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Info + Address ───────────────────────────────── */}
          <div>

            {/* Personal info card */}
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-navy">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="app-card-title">Personal Information</p>
                    <p className="app-card-sub">Your basic details on record</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editing && (
                    <button className="app-btn-outline-navy" onClick={handleCancel}>
                      Cancel
                    </button>
                  )}
                  <button
                    className={editing ? 'app-btn-navy' : 'app-btn-outline-navy'}
                    onClick={editing ? handleSave : () => setEditing(true)}
                    disabled={saving}
                    style={saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    {saving
                      ? <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 6 }} /> Saving…</>
                      : editing ? <><Save size={14} /> Save changes</> : <><Edit2 size={14} /></>}
                  </button>
                </div>
              </div>

              <div className="app-card-body">
                <div className="app-info-grid">
                  <Field label="Full Name" icon={User} name="fullName" value={draft?.fullName} editing={editing} onChange={handleFieldChange} />
                  <Field label="Gender" icon={Shield} name="gender" value={draft?.gender} editing={editing} onChange={handleFieldChange} />
                  <Field label="Date of Birth" icon={Calendar} name="dateOfBirth" value={draft?.dateOfBirth} editing={editing} onChange={handleFieldChange} />
                  <Field label="Age" icon={Hash} name="age" value={draft?.age != null ? String(draft.age) : ''} editing={editing} onChange={handleFieldChange} />
                  <Field label="Email Address" icon={Mail} name="email" value={draft?.email} editing={editing} onChange={handleFieldChange} />
                  <Field label="Mobile Number" icon={Phone} name="mobileNumber" value={draft?.mobileNumber} editing={editing} onChange={handleFieldChange} />
                </div>
              </div>
            </div>

            {/* Address card */}
            <div className="app-card">
              <div className="app-card-header">
                <div className="app-card-header-left">
                  <div className="app-icon-box app-icon-orange">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="app-card-title">Contact Address</p>
                    <p className="app-card-sub">Your registered address</p>
                  </div>
                </div>
              </div>

              <div className="app-card-body">
                {/* Full address display row */}
                <div className="app-payment-box" style={{ marginBottom: 16, marginTop: 0 }}>
                  <p className="app-payment-title">
                    <Navigation size={13} /> Full Address
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0, lineHeight: 1.6 }}>
                    {[addr.houseNo, addr.street, addr.landmark, addr.city, addr.state, addr.postalCode]
                      .filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="app-info-grid">
                  <Field label="House / Flat No." icon={Home} name="address.houseNo" value={addr.houseNo} editing={editing} onChange={handleFieldChange} />
                  <Field label="Street" icon={Building2} name="address.street" value={addr.street} editing={editing} onChange={handleFieldChange} />
                  <Field label="Landmark" icon={MapPin} name="address.landmark" value={addr.landmark} editing={editing} onChange={handleFieldChange} />
                  <Field label="City" icon={Building2} name="address.city" value={addr.city} editing={editing} onChange={handleFieldChange} />
                  <Field label="State" icon={MapPin} name="address.state" value={addr.state} editing={editing} onChange={handleFieldChange} />
                  <Field label="Postal Code" icon={Hash} name="address.postalCode" value={addr.postalCode} editing={editing} onChange={handleFieldChange} />
                </div>
              </div>
            </div>

          </div>{/* end right col */}
        </div>{/* end grid */}
      </div>

      {/* Responsive: stack on mobile, two-col on ≥992 */}
      <style>{`
        @media (min-width: 992px) {
          .profile-layout {
            grid-template-columns: 300px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;