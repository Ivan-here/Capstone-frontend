export default function Chip({
                                 label,
                                 variant = "default",
                                 onClick,
                                 className = "",
                             }) {
    const base = "chip";
    const variantClass =
        variant === "primary"
            ? "chipPrimary"
            : variant === "success"
                ? "chipSuccess"
                : "";

    return (
        <span
            className={`${base} ${variantClass} ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
        >
      {label}
    </span>
    );
}