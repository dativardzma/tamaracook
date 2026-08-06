import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function RatingModal({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${BACKEND_URL}/api/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: order.id,
          product_id: null,
          rating,
          comment: comment || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit rating');

      alert('Thank you for your rating!');
      onSuccess?.();
      onClose();
    } catch (e) {
      alert('Error: ' + (e.message || 'Failed to submit rating'));
    }
    setLoading(false);
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={s.closeBtn}>✕</button>

        <div style={s.header}>
          <h2 style={s.title}>Rate Your Order</h2>
          <p style={s.code}>Order # {order?.order_code || order?.id}</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Star Rating */}
          <div style={s.section}>
            <label style={s.label}>How was your order?</label>
            <div style={s.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    ...s.star,
                    fontSize: star <= rating ? '2.5rem' : '2rem',
                    opacity: star <= rating ? 1 : 0.4,
                    transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={s.ratingLabel}>{ratingLabels[rating]}</div>
            )}
          </div>

          {/* Comment */}
          <div style={s.section}>
            <label style={s.label}>Comments (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think? Any suggestions?"
              maxLength={300}
              style={s.textarea}
              disabled={loading}
            />
            <div style={s.charCount}>{comment.length}/300</div>
          </div>

          {/* Buttons */}
          <div style={s.buttons}>
            <button type="button" onClick={onClose} style={s.cancelBtn} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={s.submitBtn} disabled={loading || rating === 0}>
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1c0f18',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    border: '1px solid rgba(212,35,94,0.2)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    color: 'white',
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  code: {
    color: 'rgba(255,255,255,0.5)',
    margin: '0.5rem 0 0 0',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  stars: {
    display: 'flex',
    gap: '0.8rem',
    justifyContent: 'center',
  },
  star: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  ratingLabel: {
    textAlign: 'center',
    color: '#d4235e',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  textarea: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(212,35,94,0.2)',
    borderRadius: '8px',
    padding: '0.8rem',
    color: 'white',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    minHeight: '100px',
    resize: 'vertical',
  },
  charCount: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
  },
  buttons: {
    display: 'flex',
    gap: '1rem',
  },
  cancelBtn: {
    flex: 1,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    borderRadius: '8px',
    padding: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    background: '#d4235e',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    padding: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
