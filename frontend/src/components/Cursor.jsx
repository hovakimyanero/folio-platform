import { useEffect, useRef, useState } from 'react';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Check if touch device
    if ('ontouchstart' in window) return;

    let cx = 0, cy = 0, rx = 0, ry = 0;

    const onMove = (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = cx + 'px';
        dotRef.current.style.top = cy + 'px';
      }
    };

    function ringLoop() {
      rx += (cx - rx) * 0.1;
      ry += (cy - ry) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      requestAnimationFrame(ringLoop);
    }

    document.addEventListener('mousemove', onMove);
    ringLoop();

    // Hover detection
    const onOver = (e) => {
      if (e.target.closest('a, button, [data-hoverable], .pcard, .scard')) {
        setHovering(true);
      }
    };
    const onOut = (e) => {
      if (e.target.closest('a, button, [data-hoverable], .pcard, .scard')) {
        setHovering(false);
      }
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  // Hide on mobile
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          width: hovering ? 50 : 8,
          height: hovering ? 50 : 8,
          borderRadius: '50%',
          background: hovering ? 'rgba(79,209,255,0.1)' : 'var(--text)',
          mixBlendMode: 'difference',
          transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1), height 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9997,
          transform: 'translate(-50%, -50%)',
          width: hovering ? 50 : 44,
          height: hovering ? 50 : 44,
          borderRadius: '50%',
          border: `1.5px solid ${hovering ? 'rgba(79,209,255,0.3)' : 'rgba(240,240,245,0.2)'}`,
          transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </>
  );
}
