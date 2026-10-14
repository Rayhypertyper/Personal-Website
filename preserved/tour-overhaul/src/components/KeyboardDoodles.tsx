export function KeyboardDoodles() {
  return (
    <div className="keyboard-doodles" aria-hidden="true">
      <svg className="keyboard-doodle keyboard-doodle--webcam" viewBox="0 0 100 80" fill="none">
        <path className="keyboard-doodle__wash" d="m23 20 51-2 5 30-57 2Z" />
        <path d="m23 20 51-2c4 0 6 3 6 7l-1 19c0 4-3 6-7 6l-46 1c-4 0-6-3-6-7l1-18c0-3 0-5 2-6Z" />
        <path d="M59 34c0 7-5 12-12 11s-11-6-10-12 6-10 12-10 10 5 10 11ZM43 51l-3 12m16-12 4 12m-31 2 43-1M25 11l-5-6m29 5V3m22 7 5-6" />
        <path d="M46 29c-3 1-4 3-4 5m25-5h3" />
      </svg>

      <svg className="keyboard-doodle keyboard-doodle--keys" viewBox="0 0 116 78" fill="none">
        <path className="keyboard-doodle__wash" d="m15 15 31-3 3 30-32 3Zm46 7 32 2-2 29-32-2Z" />
        <path d="m15 15 31-3 3 30-32 3-2-30Zm46 7 32 2-2 29-32-2 2-29ZM25 33l6-13 7 12m-10-4h7M80 31c-10-5-13 3-5 5s6 9-3 5" />
        <path d="m21 57 29-2m13 9 24 1m13-35 6-2m-8 16 8 1" />
        <path className="keyboard-doodle__faint" d="m10 51 1 17 37-3m7-7-1 15 40 1 1-16" />
      </svg>
    </div>
  );
}
