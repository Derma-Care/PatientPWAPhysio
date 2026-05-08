import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
  CButton,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CBadge,
} from '@coreui/react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Activity,
  FileText,
  ChevronRight,
  ClipboardList,
  Target,
  FlaskConical,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import { physiotherapyService } from '../services/api';

const VisitHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchHistory = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const patientId = urlParams.get('patientId');
        
        if (!patientId || !id) return;

        setLoading(true);
        const response = await physiotherapyService.getVisitHistory(patientId, id);
        if (!abortController.signal.aborted) {
          setHistory(response.data || []);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching visit history:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => abortController.abort();
  }, [id, location.search]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <CButton color="link" className="p-0 text-decoration-none text-secondary mb-3 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </CButton>
        <h2 className="fw-bold text-dark m-0">Visit History</h2>
        <p className="text-secondary">Detailed records of your therapy visits</p>
      </div>

      <CRow>
        <CCol lg={10} className="mx-auto">
          {history.length > 0 ? (
            <CAccordion flush className="rounded-4 overflow-hidden border shadow-sm bg-white">
              {history.map((visit, idx) => (
                <CAccordionItem itemKey={idx} key={idx} className="border-bottom">
                  <CAccordionHeader className="p-2">
                    <div className="w-100 d-flex justify-content-between align-items-center pe-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '45px', height: '45px' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="fw-bold text-dark fs-5">{visit.visitNumber}</div>
                          <div className="small text-secondary fw-semibold">
                            {visit.visitDate} • {visit.visitTime}
                          </div>
                        </div>
                      </div>
                      <CBadge color="primary" shape="pill" className="px-3 py-2 bg-opacity-10 text-primary fw-bold">
                        Completed
                      </CBadge>
                    </div>
                  </CAccordionHeader>
                  <CAccordionBody className="p-4 bg-light bg-opacity-25">
                    <CRow className="g-4">
                      {/* Section 1: Complaints & Investigation */}
                      <CCol md={6}>
                        <div className="premium-card p-3 bg-white mb-4">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Activity size={18} className="text-danger" /> Complaints & Investigation
                          </h6>
                          <div className="small mb-3">
                            <span className="text-secondary d-block">Details:</span>
                            <span className="fw-semibold text-dark">{visit.physiotherapyDoctorData?.complaints?.complaintDetails || 'None'}</span>
                          </div>
                          <div className="small">
                            <span className="text-secondary d-block">Tests Performed:</span>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                              {visit.physiotherapyDoctorData?.investigation?.tests?.map((test, i) => (
                                <CBadge key={i} color="info" variant="outline" shape="pill" className="fw-bold px-3">{test}</CBadge>
                              )) || <span className="text-secondary">None</span>}
                            </div>
                          </div>
                        </div>

                        <div className="premium-card p-3 bg-white">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <ClipboardList size={18} className="text-primary" /> Assessment Summary
                          </h6>
                          <div className="small mb-2 d-flex justify-content-between">
                            <span className="text-secondary">Pain Type:</span>
                            <span className="fw-semibold">{visit.physiotherapyDoctorData?.assessment?.subjectiveAssessment?.painType || 'N/A'}</span>
                          </div>
                          <div className="small mb-2 d-flex justify-content-between">
                            <span className="text-secondary">Onset:</span>
                            <span className="fw-semibold">{visit.physiotherapyDoctorData?.assessment?.subjectiveAssessment?.onset || 'N/A'}</span>
                          </div>
                          <div className="small mb-2 d-flex justify-content-between">
                            <span className="text-secondary">Difficulties:</span>
                            <span className="fw-semibold text-end">{Array.isArray(visit.physiotherapyDoctorData?.assessment?.functionalAssessment?.difficultiesIn) ? visit.physiotherapyDoctorData.assessment.functionalAssessment.difficultiesIn.join(', ') : 'None'}</span>
                          </div>
                        </div>
                      </CCol>

                      {/* Section 2: Diagnosis & Treatment */}
                      <CCol md={6}>
                        <div className="premium-card p-3 bg-white mb-4">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Stethoscope size={18} className="text-success" /> Physio Diagnosis
                          </h6>
                          <div className="mb-3">
                            <div className="fw-bold text-dark fs-5 mb-1">{visit.physiotherapyDoctorData?.diagnosis?.physioDiagnosis}</div>
                            <div className="d-flex gap-2">
                              <CBadge color="warning" className="px-2 py-1 text-dark">Severity: {visit.physiotherapyDoctorData?.diagnosis?.severity}</CBadge>
                              <CBadge color="info" className="px-2 py-1">Stage: {visit.physiotherapyDoctorData?.diagnosis?.stage}</CBadge>
                            </div>
                          </div>
                          <div className="small text-secondary">
                            Affected Area: <span className="text-dark fw-semibold">{visit.physiotherapyDoctorData?.diagnosis?.affectedArea}</span>
                          </div>
                        </div>

                        <div className="premium-card p-3 bg-white">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                            <Target size={18} className="text-warning" /> Treatment Plan
                          </h6>
                          <div className="small mb-2">
                            <span className="text-secondary">Therapist:</span>
                            <span className="ms-2 fw-bold text-dark">{visit.physiotherapyDoctorData?.treatmentPlan?.therapistName}</span>
                          </div>
                          <div className="small mb-4">
                            <span className="text-secondary">Programs:</span>
                            <div className="mt-2 d-flex flex-column gap-2">
                              {visit.physiotherapyDoctorData?.therapySessions?.[0]?.programs?.map((prog, i) => (
                                <div key={i} className="p-2 border rounded-3 bg-light small fw-semibold">
                                  {prog.programName}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <CButton 
                            className="btn-premium w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => navigate(`/bookings/${id}/sessions?patientId=${visit.physiotherapyDoctorData?.patientInfo?.patientId}&therapistRecordId=${visit.physiotherapyDoctorData?.therapistRecordId}&clinicId=${visit.physiotherapyDoctorData?.clinicId}&branchId=${visit.physiotherapyDoctorData?.branchId}`)}
                          >
                            <Activity size={18} /> View Activity Sessions
                          </CButton>
                        </div>
                      </CCol>
                    </CRow>
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          ) : (
            <div className="text-center py-5">
              <ClipboardList size={64} className="text-secondary opacity-25 mb-3" />
              <h4>No visit history found</h4>
            </div>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default VisitHistory;
