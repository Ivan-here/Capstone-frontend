export default function Input({
                                  label,
                                  value,
                                  onChange,
                                  placeholder = "",
                                  type = "text",
                                  name,
                                  error,
                                  disabled = false,
                              }) {
    return (
        <div className="inputGroup">
            {label && <label className="inputLabel">{label}</label>}

            <input
                className={`input ${error ? "input-error" : ""}`}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />

            {error && <div className="inputError">{error}</div>}
        </div>
    );
}