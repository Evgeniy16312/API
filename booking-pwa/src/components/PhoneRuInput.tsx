"use client";

import { composeRuPhone, nationalPhoneDigits } from "@/lib/validate";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (canonical: string) => void;
  required?: boolean;
  disabled?: boolean;
  "data-testid"?: string;
  className?: string;
};

export default function PhoneRuInput({
  id,
  name,
  value,
  onChange,
  required,
  disabled,
  className = "",
  "data-testid": testId,
}: Props) {
  const national = nationalPhoneDigits(value);

  function handleChange(raw: string) {
    let d = raw.replace(/\D/g, "");
    // +7 / 8 left in the field when pasting a full number
    if (d.startsWith("7") || d.startsWith("8")) d = d.slice(1);
    d = d.slice(0, 10);
    onChange(composeRuPhone(d));
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-sm font-medium text-[#57534e] bg-[#f4f0ea] border border-r-0 border-[#e7e0d6] rounded-l-2xl px-3 min-h-12 flex items-center">
        +7
      </span>
      <input
        id={id}
        name={name}
        data-testid={testId}
        className="input rounded-l-none"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="9991234567"
        required={required}
        disabled={disabled}
        aria-label="Номер телефона, 10 цифр после +7"
      />
    </div>
  );
}
