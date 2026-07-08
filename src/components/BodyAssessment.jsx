import React, { useState, useRef, useEffect } from 'react';
import front from '../assets/body_front.png';
import back from '../assets/body_back.png';
import BodySvg from './BodySvg';
import QuestionModal from './QuestionModal';
import { CSpinner } from '@coreui/react';
import { toast } from '../utils/toast';

const PRIMARY_COLOR = "#1B4F8A";

export default function BodyAssessment({ onPartClick, initialSelected = [], initialAnswers = {}, initialImage = null }) {
  const [view, setView] = useState('front');
  const [selected, setSelected] = useState([]);
  const [modalPart, setModalPart] = useState(null);

  useEffect(() => {
    if (initialSelected && initialSelected.length > 0 && selected.length === 0) {
      setSelected(initialSelected);
    }
  }, [initialSelected]);

  const [answerData, setAnswerData] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalImage, setFinalImage] = useState(null);
  const svgRef = useRef();

  const handleClick = (id, event) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    let x = px * 600;
    let y = py * 600;

    if (px > 0.5) {
      x = 300 + (px - 0.5) * 600;
    } else {
      x = px * 600;
    }

    if (selected.includes(id)) {
      setSelected((prev) => prev.filter((p) => p !== id));
      setPoints((prev) => prev.filter((p) => p.id !== id));
    } else {
      setSelected((prev) => [...prev, id]);
      setPoints((prev) => [...prev, { id, x, y }]);
    }
  };

  const getColor = (id) => {
    return 'transparent';
  };

  const handleSaveAnswers = (data) => {
    const newAnswers = [...answerData, data];
    const selectedParts = [...selected];

    setAnswerData(newAnswers);
    setModalPart(null);
    setSelected([]);

    if (onPartClick) {
      onPartClick({
        parts: selectedParts,
        image: finalImage,
        answerData: newAnswers,
      });
    }
  };

  const sendToParent = async () => {
    const effectiveSelected = selected.length > 0 ? selected : (initialSelected && initialSelected.length > 0 ? initialSelected : []);
    if (effectiveSelected.length === 0) {
      toast.error("Required", "Please select at least one body part.");
      return;
    }
    setLoading(true);

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });

    try {
      if (points.length === 0 && initialImage) {
        setFinalImage(initialImage);
        setModalPart([...effectiveSelected]);
        handleClear();
        return;
      }

      const [fImg, bImg] = await Promise.all([loadImage(front), loadImage(back)]);

      ctx.drawImage(fImg, 0, 0, 300, 550);
      ctx.drawImage(bImg, 300, 0, 300, 600);

      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
      });

      const base64 = canvas.toDataURL("image/png").split(',')[1];
      setFinalImage(base64);
      setModalPart([...effectiveSelected]);
      handleClear();
    } catch (error) {
      console.error("Error opening assessment modal:", error);
      toast.error("Error", "Could not prepare assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelected([]);
    setPoints([]);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          overflowX: 'auto',
          maxWidth: '100%',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-md)',
          padding: 8,
          background: '#fff',
          boxShadow: 'var(--s-sm)'
        }}>
          <svg
            ref={svgRef}
            viewBox="0 0 600 600"
            width="100%"
            style={{ maxWidth: 450, display: 'block', margin: '0 auto' }}
          >
            <image href={front} x="0" y="0" width="300" height="550" />
            <image href={back} x="300" y="0" width="300" height="600" />

            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                className="dot"
              />
            ))}

            <BodySvg
              view={view}
              onClickPart={handleClick}
              getColor={getColor}
            />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: '100%',
            maxWidth: 450,
            gap: "12px",
            marginTop: "14px",
          }}
        >
          {selected.length > 0 ? (
            <div style={{ color: PRIMARY_COLOR, fontSize: 13, fontWeight: 600, width: '100%' }}>
              <b>Selected:</b> {selected.join(", ")}
            </div>
          ) : (
            <div style={{ color: 'var(--c-text-3)', fontSize: 13, width: '100%' }}>
              Tap body areas above to draw/mark pain locations.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClear}
              style={{ fontSize: 13, flex: 1 }}
            >
              Clear
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={sendToParent}
              disabled={loading}
              style={{ backgroundColor: PRIMARY_COLOR, border: 'none', color: '#fff', fontSize: 13, flex: 1 }}
            >
              {loading ? (
                <span><CSpinner size="sm" /> Generating...</span>
              ) : (
                "Select & Answer"
              )}
            </button>
          </div>
        </div>

        {modalPart && (
          <QuestionModal
            visible={true}
            partId={modalPart}
            onClose={() => setModalPart(null)}
            onSave={handleSaveAnswers}
            initialAnswers={initialAnswers}
          />
        )}
      </div>

      <style>{`
        .dot {
          fill: red;
          transform-box: fill-box;
          transform-origin: center;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
