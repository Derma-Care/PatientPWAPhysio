import React, { useEffect, useState } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormCheck,
  CSpinner,
} from "@coreui/react";
import { bookingService } from "../services/api";

const PRIMARY_COLOR = "#1B4F8A";

export default function QuestionModal({
  visible,
  partId,
  onClose,
  onSave,
  initialAnswers = {}
}) {
  const partIds = Array.isArray(partId) ? partId : [partId];
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsByPart, setQuestionsByPart] = useState({});

  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      const flatAnswers = {};
      Object.keys(initialAnswers).forEach(part => {
        const arr = initialAnswers[part];
        if (Array.isArray(arr)) {
          arr.forEach(q => {
            flatAnswers[`${part}_${q.questionId}`] = q.answer && q.answer.includes(',') 
              ? q.answer.split(', ').map(s => s.trim()) 
              : q.answer;
          });
        }
      });
      setAnswers(flatAnswers);
    }
  }, [initialAnswers]);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fetchQuestions = async () => {
    if (!partIds || partIds.length === 0) return;
    try {
      setLoadingQuestions(true);
      const res = await bookingService.getQuestionsByKey(partIds);
      if (res?.data) {
        setQuestionsByPart(res.data);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSave = () => {
    const therapyQuestion = partIds.map((part) => {
      const questions = questionsByPart?.[part] || [];
      const ans = questions.map((q) => {
        const key = part + "_" + q.questionId;
        return {
          questionId: q.questionId,
          answer: Array.isArray(answers[key])
            ? answers[key].join(", ")
            : answers[key] || "",
        };
      });
      return {
        bodyPart: part,
        answers: ans,
      };
    });

    const formattedAnswers = {};
    therapyQuestion.forEach((item) => {
      formattedAnswers[item.bodyPart] = item.answers;
    });

    onSave({
      parts: partIds,
      answerData: formattedAnswers,
    });
  };

  useEffect(() => {
    if (partId) {
      setQuestionsByPart({});
      setAnswers({});        // ← clear previous answers on new body-part selection
      fetchQuestions();
    }
  }, [partId]);

  const handleMultiSelect = (key, value) => {
    setAnswers((prev) => {
      let existing = prev[key];
      if (!existing) existing = [];
      else if (!Array.isArray(existing)) {
        existing = existing.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (existing.includes(value)) {
        return {
          ...prev,
          [key]: existing.filter((v) => v !== value),
        };
      } else {
        return {
          ...prev,
          [key]: [...existing, value],
        };
      }
    });
  };

  return (
    <>
      <style>
        {`
        .form-check-input:checked {
          background-color: ${PRIMARY_COLOR};
          border-color: ${PRIMARY_COLOR};
        }
        `}
      </style>

      <CModal visible={visible} onClose={onClose} size="lg" backdrop="static" className="custom-modal">
        <CModalHeader>
          <CModalTitle style={{ color: PRIMARY_COLOR }}>
            Assessment - {partIds.join(", ")}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {partIds.map((part) => {
            const questions = questionsByPart[part] || [];
            return (
              <div key={part} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
                <h5 style={{ fontWeight: 700, textTransform: 'uppercase' }}>{part}</h5>
                {loadingQuestions ? (
                  <div style={{ color: PRIMARY_COLOR }}><CSpinner size="sm" /> Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div style={{ color: PRIMARY_COLOR }}>No questions</div>
                ) : null}

                {questions.map((q) => {
                  const key = part + "_" + q.questionId;
                  return (
                    <div key={q.questionId} className="mb-3">
                      <label style={{ color: PRIMARY_COLOR, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        {q.question}
                      </label>

                      {q.type === "YES/NO" && (
                        <div>
                          <CFormCheck
                            type="radio"
                            name={key}
                            label="Yes"
                            value="YES"
                            checked={answers[key] === "YES"}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={{ color: PRIMARY_COLOR }}
                          />
                          <CFormCheck
                            type="radio"
                            name={key}
                            label="No"
                            value="NO"
                            checked={answers[key] === "NO"}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={{ color: PRIMARY_COLOR }}
                          />
                        </div>
                      )}

                      {q.type === "TEXT" && (
                        <CFormInput
                          type="text"
                          value={answers[key] !== undefined && answers[key] !== null ? answers[key] : ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          style={{
                            color: PRIMARY_COLOR,
                            borderColor: PRIMARY_COLOR
                          }}
                        />
                      )}

                      {q.type === "NUMBER" && (
                        <CFormInput
                          type="number"
                          value={answers[key] !== undefined && answers[key] !== null ? answers[key] : ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          style={{
                            color: PRIMARY_COLOR,
                            borderColor: PRIMARY_COLOR
                          }}
                        />
                      )}

                      {q.type === "SELECT" && (
                        <div>
                          {q.options?.map((opt, index) => (
                            <CFormCheck
                              key={index}
                              type="checkbox"
                              label={opt}
                              value={opt}
                              checked={Array.isArray(answers[key]) ? answers[key].includes(opt) : (answers[key] ? answers[key].split(',').map(s=>s.trim()).includes(opt) : false)}
                              onChange={() => handleMultiSelect(key, opt)}
                              style={{ color: PRIMARY_COLOR }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Close
          </CButton>
          <CButton color="primary" onClick={handleSave} style={{ backgroundColor: PRIMARY_COLOR }}>
            Save
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
}
