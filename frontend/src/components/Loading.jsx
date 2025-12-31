/**
 * Loading
 *
 * Simple loading state to prevent "blank screen" while requests are in flight.
 */

export default function Loading({ label = "Loading..." }) {
    return (
        <div style = {{ padding: 12, opacity: 0.85 }}>
            {label}
        </div>
    );
}