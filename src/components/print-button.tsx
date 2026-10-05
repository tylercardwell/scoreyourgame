'use client';
export function PrintButton() {
  return (
    <button className="tour-btn tour-btn-solid no-print" onClick={() => window.print()}>
      Print this scorecard
    </button>
  );
}
