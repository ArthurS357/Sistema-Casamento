"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface NameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

/**
 * Capitaliza as primeiras letras de cada palavra.
 * Ex: "maria da silva" -> "Maria da Silva"
 */
function capitalizeName(name: string) {
  return name
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      // Preposições comuns no Brasil não devem ser capitalizadas a menos que sejam a primeira palavra
      const lower = word.toLowerCase();
      if (["da", "de", "do", "das", "dos", "e"].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export const NameInput = React.forwardRef<HTMLInputElement, NameInputProps>(
  ({ value, onChange, onValueChange, onBlur, ...props }, ref) => {
    // Mantemos um estado local para a digitação fluida sem "pular o cursor"
    const [localValue, setLocalValue] = React.useState(value ?? "");

    // Sincroniza se o value vier de fora (ex: carregamento inicial)
    React.useEffect(() => {
      if (value !== undefined) setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Removemos caracteres especiais indesejados em nomes se necessário, ou só aceitamos letras.
      // Permitindo letras, acentos, espaços e apóstrofos.
      const sanitized = val.replace(/[^a-zA-ZÀ-ÿ\s']/g, "");
      setLocalValue(sanitized);

      if (onChange) onChange(e);
      if (onValueChange) onValueChange(sanitized);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const formatted = capitalizeName(localValue as string);
      setLocalValue(formatted);

      if (onChange) {
        // Mock um evento para atualizar o form
        const event = { ...e, target: { ...e.target, value: formatted } };
        onChange(event as React.ChangeEvent<HTMLInputElement>);
      }
      if (onValueChange) onValueChange(formatted);
      if (onBlur) onBlur(e);
    };

    return (
      <Input
        ref={ref}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
NameInput.displayName = "NameInput";
