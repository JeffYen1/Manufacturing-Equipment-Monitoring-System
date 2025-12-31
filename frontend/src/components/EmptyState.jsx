/**
 * EmptyState
 *
 * Used when the request succeeds, but there is no data (e.g., no readings yet).
 * This avoids confusing users with an empty page.
 */

export default function EmptyState({ message }) {
    return <div style = {{ padding: 12, opacity: 0.8 }}>{message}</div>;
}