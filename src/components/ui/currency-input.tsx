"use client";

import * as React from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<NumericFormatProps, "value" | "onChange"> {
  /** Valor em CENTAVOS (inteiro). Ex: 125000 para R$ 1.250,00 */
  value?: number;
  /** Retorna o valor em CENTAVOS (inteiro). */
  onChange?: (valueInCents: number) => void;
  className?: string;
  error?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, error, ...props }, ref) => {
    // Converte centavos (125000) para reais (1250.00) para o react-number-format exibir
    const valueInReais = value !== undefined ? value / 100 : undefined;

    return (
      <NumericFormat
        getInputRef={ref}
        value={valueInReais}
        onValueChange={(values) => {
          if (onChange) {
            // values.floatValue é o número em reais (ex: 1250.00)
            // Multiplicamos por 100 e arredondamos para evitar float precision issues
            const cents = values.floatValue !== undefined ? Math.round(values.floatValue * 100) : 0;
            onChange(cents);
          }
        }}
        thousandSeparator="."
        decimalSeparator=","
        prefix="R$ "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
        className={cn(
          "flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:border-gold-500 transition-shadow duration-200",
          error && "border-red-500 ring-red-500 ring-1",
          className
        )}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
