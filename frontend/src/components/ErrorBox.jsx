/**
 * ErrorBox
 *
 * A reusable error display with an optional Retry button.
 * We keep errors visible in the UI (instead of crashing / blank page)
 * which is important for real manufacturing systems where uptime matters.
 */

export default function ErrorBox({ title = "Error", message, onRetry }) {
    return (
        <div style={{ padding: 12, border: "1px solid #999", borderRadius: 10 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{message}</div>

            {onRetry && (
                <button
                onClick={onRetry}
                style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #444",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 700,
                }}
                >
                Retry
                </button>
            )}
            </div>
    )
}