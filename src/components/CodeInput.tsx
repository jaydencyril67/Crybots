import React, { useRef } from 'react';

type CodeInputProps = {
  id?: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'numeric' | 'text' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none';
  autoComplete?: string;
  type?: 'text' | 'password';
  disabled?: boolean;
  color?: string;
  borderColor?: string;
  background?: string;
};

const CodeInput = ({
  id,
  length,
  value,
  onChange,
  inputMode = 'numeric',
  autoComplete,
  type = 'text',
  disabled = false,
  color = 'inherit',
  borderColor = 'currentColor',
  background = 'transparent',
}: CodeInputProps) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] || '');

  const updateValue = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    onChange(nextDigits.join(''));
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      onChange(nextDigits.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div id={id} role="group" aria-label="Code entry" style={{ display: 'flex', gap: '8px', width: '100%' }}>
      {digits.map((digit, index) => (
        <input
          key={`${id || 'code'}-${index}`}
          ref={(element) => { inputRefs.current[index] = element; }}
          aria-label={`Code digit ${index + 1} of ${length}`}
          type={type}
          inputMode={inputMode}
          maxLength={1}
          value={digit}
          onChange={(event) => updateValue(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoComplete={index === 0 ? autoComplete : 'off'}
          disabled={disabled}
          style={{
            flex: '1 1 0',
            minWidth: 0,
            height: '52px',
            boxSizing: 'border-box',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`,
            background,
            color,
            textAlign: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
};

export default CodeInput;
