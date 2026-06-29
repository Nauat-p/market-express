import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "number";
  mask?: (value: string) => string;
  validate?: (value: string) => { valid: boolean; error?: string };
  error?: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
  autoComplete?: string;
}

export function FormField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  type = "text",
  mask,
  validate,
  error,
  hint,
  icon,
  disabled,
  autoComplete,
}: FormFieldProps) {
  const validation = validate ? validate(value) : { valid: true };
  const hasError = error || (!validation.valid && value.length > 0);
  const isValid = validation.valid && value.length > 0 && !error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (mask) {
      newValue = mask(newValue);
    }
    onChange(newValue);
  };

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        {isValid && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {hasError && <AlertCircle className="w-4 h-4 text-destructive" />}
      </div>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full bg-muted/60 ring-1 rounded-xl py-2.5 px-3 text-sm focus:outline-none transition-all ${
            icon ? "pl-10" : ""
          } ${
            hasError
              ? "ring-destructive/50 focus:ring-2 focus:ring-destructive/30"
              : isValid
                ? "ring-green-500/50 focus:ring-2 focus:ring-green-500/30"
                : "ring-border focus:ring-2 focus:ring-primary/30"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
      </div>

      {hasError && validation.error && (
        <p className="text-[11px] text-destructive mt-1.5 font-medium">
          {validation.error}
        </p>
      )}

      {hint && !hasError && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>
      )}
    </label>
  );
}
