import React, { useEffect, useState } from 'react';
import {
  MapPin, Phone, Mail, Globe, Clock,
  ShieldCheck, ExternalLink, Award,
  Navigation, PlayCircle, ChevronRight,

} from 'lucide-react';
import CIcon from '@coreui/icons-react';
import { cibFacebook, cibTwitter, cibInstagram } from '@coreui/icons';
import { clinicService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ClinicDetails = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        if (user?.hospitalId) {
          const response = await clinicService.getClinic(user.hospitalId);
          setClinic(response.data);
        }
      } catch (error) {
        console.error('Error fetching clinic details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinic();
  }, [user]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-ring" />
        <p className="app-loading-text">Loading clinic details…</p>
      </div>
    );
  }

  const logoSrc = (() => {
    const logo = clinic?.hospitalLogo || clinic?.clinicLogo;
    if (!logo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(clinic?.name ?? 'Clinic')}&background=1B4F8A&color=fff`;
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
    return `data:image/png;base64,${logo}`;
  })();

  return (
    <div className="app-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="app-hero">
        <div className="app-hero-inner">
          <h1 className="app-hero-title">Clinic Details</h1>
          <p className="app-hero-sub">Comprehensive information about our medical facilities and services</p>
        </div>
      </div>

      <div className="app-body" style={{ marginTop: -36 }}>

        {/* ── Clinic identity banner ──────────────────────────────────────── */}
        <div className="app-card" style={{ marginBottom: 24 }}>

          {/* Gradient banner strip */}
          <div style={{
            background: 'var(--g-navy)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
            padding: '28px 28px 64px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 80% 30%, rgba(249,115,22,.22) 0%, transparent 55%)',
            }} />
            {/* subscription badge top-right */}
            <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 1 }}>
              <span className="app-status-pill app-status-confirmed">
                <span className="app-status-dot" />
                {clinic?.subscription || 'Verified'} Clinic
              </span>
            </div>
          </div>

          {/* Logo + name overlap */}
          <div style={{
            padding: '0 28px 28px',
            marginTop: -52,
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 96, height: 96, flexShrink: 0,
              background: 'var(--c-surface)',
              borderRadius: 'var(--r-md)',
              border: '4px solid var(--c-surface)',
              boxShadow: 'var(--s-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img src={logoSrc} alt={clinic?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--c-text)' }}>
                {clinic?.name}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} style={{ color: 'var(--c-orange)', flexShrink: 0 }} />
                {clinic?.address}
              </p>
            </div>
          </div>

          {/* Two-col info grid */}
          <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}
            className="clinic-two-col">

            {/* Contact */}
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '.8px',
                textTransform: 'uppercase', color: 'var(--c-navy)', marginBottom: 14,
                paddingBottom: 8, borderBottom: '2px solid var(--c-navy-light)'
              }}>
                Contact Details
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Phone, label: 'Phone Support', value: clinic?.contactNumber, color: 'app-icon-navy' },
                  { icon: Mail, label: 'Email Address', value: clinic?.emailAddress, color: 'app-icon-sky' },
                  {
                    icon: Globe, label: 'Official Website',
                    value: clinic?.website?.replace('https://', ''),
                    href: clinic?.website, color: 'app-icon-green'
                  },
                ].map(({ icon: Icon, label, value, href, color }) => (
                  <div key={label} className="app-info-item">
                    <div className={`app-icon-box ${color}`} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="app-info-label" style={{ marginBottom: 2 }}>{label}</p>
                      {href
                        ? <a href={href} target="_blank" rel="noreferrer" className="app-link-btn" style={{ fontSize: 13 }}>{value}</a>
                        : <p className="app-info-value" style={{ fontSize: 13 }}>{value || '—'}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility */}
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '.8px',
                textTransform: 'uppercase', color: 'var(--c-navy)', marginBottom: 14,
                paddingBottom: 8, borderBottom: '2px solid var(--c-navy-light)'
              }}>
                Facility Information
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="app-info-item">
                  <div className="app-icon-box app-icon-amber" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="app-info-label" style={{ marginBottom: 2 }}>Operational Hours</p>
                    <p className="app-info-value" style={{ fontSize: 13 }}>{clinic?.openingTime} – {clinic?.closingTime}</p>
                  </div>
                </div>
                <div className="app-info-item">
                  <div className="app-icon-box app-icon-green" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="app-info-label" style={{ marginBottom: 2 }}>Registration Number</p>
                    <p className="app-info-value" style={{ fontSize: 13 }}>{clinic?.licenseNumber || '—'}</p>
                  </div>
                </div>
                <div className="app-info-item">
                  <div className="app-icon-box app-icon-orange" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }}>
                    <Award size={16} />
                  </div>
                  <div>
                    <p className="app-info-label" style={{ marginBottom: 2 }}>NABH Score</p>
                    <p className="app-info-value" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {clinic?.nabhScore} / 10
                      <span className="app-booking-chip" style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', fontSize: 10 }}>
                        ✓ Verified
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main body: branches + sidebar ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="clinic-layout">

          {/* Left: branches */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 4, height: 20, background: 'var(--g-navy-soft)', borderRadius: 4, display: 'inline-block' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, margin: 0 }}>
                Active Branch Locations
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {clinic?.branches?.map((branch, idx) => (
                <div key={idx} className="app-booking-item" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div className="app-icon-box app-icon-navy" style={{ width: 44, height: 44, borderRadius: 12 }}>
                      <MapPin size={20} />
                    </div>
                    <button
                      className="app-btn-outline-navy"
                      style={{ fontSize: 11, padding: '5px 12px' }}
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`, '_blank')}
                    >
                      <Navigation size={12} /> Navigate
                    </button>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, margin: '0 0 6px' }}>
                    {branch.branchName}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--c-text-2)', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {branch.address}
                  </p>
                  <div style={{
                    borderTop: '1px solid var(--c-border)', paddingTop: 12,
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-text-2)'
                  }}>
                    <Phone size={12} style={{ color: 'var(--c-navy)', flexShrink: 0 }} />
                    {branch.contactNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Social presence */}
            <div className="app-card">
              <div className="app-card-header">
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '.8px',
                  textTransform: 'uppercase', color: 'var(--c-navy)', margin: 0
                }}>
                  Social Presence
                </p>
              </div>
              <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: cibInstagram, label: 'Instagram', handle: '@kinetixwellness', iconColor: '#e1306c', bg: '#fce4ec' },
                  { icon: cibTwitter, label: 'Twitter', handle: '@kinetixcare', iconColor: '#1da1f2', bg: '#e0f2fe' },
                  { icon: cibFacebook, label: 'Facebook', handle: 'Kinetix Wellness', iconColor: '#1877f2', bg: '#e8f0fe' },
                ].map(({ icon, label, handle, iconColor, bg }) => (
                  <a key={label} href="#" className="app-info-item"
                    style={{ textDecoration: 'none', cursor: 'pointer', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <CIcon icon={icon} style={{ color: iconColor, width: 18, height: 18 }} />
                      </div>
                      <div>
                        <p className="app-info-value" style={{ fontSize: 13, marginBottom: 1 }}>{label}</p>
                        <p className="app-info-label" style={{ textTransform: 'none', letterSpacing: 0, margin: 0 }}>{handle}</p>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: 'var(--c-text-3)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Virtual tour */}
            <div className="app-card" style={{ overflow: 'hidden' }}>
              <div className="app-card-header">
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: '.8px',
                  textTransform: 'uppercase', color: 'var(--c-navy)', margin: 0
                }}>
                  Virtual Experience
                </p>
              </div>
              <div className="app-card-body" style={{ paddingTop: 0 }}>
                <div style={{
                  position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden',
                  height: 180, marginBottom: 14
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
                    alt="Clinic tour"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(13,40,71,.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <button
                      className="app-btn-ghost"
                      style={{
                        background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.4)',
                        borderRadius: '50%', width: 56, height: 56, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}
                      onClick={() => clinic?.walkthrough && window.open(clinic.walkthrough, '_blank')}
                    >
                      <PlayCircle size={30} style={{ color: '#fff' }} />
                    </button>
                  </div>
                </div>
                <button
                  className="app-btn-navy"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 0', borderRadius: 'var(--r-md)' }}
                  onClick={() => clinic?.walkthrough && window.open(clinic.walkthrough, '_blank')}
                >
                  Start 360° Tour <ExternalLink size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .clinic-layout { grid-template-columns: 1fr 320px !important; }
          .clinic-two-col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .clinic-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ClinicDetails;