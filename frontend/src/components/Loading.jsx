export default function Loading({ label = "Loading..." }) {
    return (
        <div style = {{ padding: 12, opacity: 0.85 }}>
            {label}
        </div>
    );
}