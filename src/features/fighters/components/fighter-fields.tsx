"use client";

import { createContext, useContext, type ComponentProps } from "react";
import { FormField, formFieldErrorId } from "@/components/admin/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type FieldsContextValue = { defaults: Record<string, string>; errors: Record<string, string> };

const FieldsContext = createContext<FieldsContextValue>({ defaults: {}, errors: {} });

export const FighterFieldsProvider = FieldsContext.Provider;

type BaseProps = { name: string; label: string; hint?: string };

/** Datos comunes de un campo: id estable, valor inicial y error del servidor junto al input. */
function useField(name: string) {
  const { defaults, errors } = useContext(FieldsContext);
  const id = `fighter-${name}`;
  const error = errors[name];
  return {
    id,
    error,
    defaultValue: defaults[name] ?? "",
    aria: { "aria-invalid": error ? true : undefined, "aria-describedby": error ? formFieldErrorId(id) : undefined },
  };
}

export function TextField({ name, label, hint, ...inputProps }: BaseProps & Omit<ComponentProps<typeof Input>, "name" | "id" | "defaultValue">) {
  const { id, error, defaultValue, aria } = useField(name);
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Input id={id} name={name} defaultValue={defaultValue} {...aria} {...inputProps} />
    </FormField>
  );
}

export function TextAreaField({ name, label, hint, ...props }: BaseProps & Omit<ComponentProps<typeof Textarea>, "name" | "id" | "defaultValue">) {
  const { id, error, defaultValue, aria } = useField(name);
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Textarea id={id} name={name} defaultValue={defaultValue} {...aria} {...props} />
    </FormField>
  );
}

export function SelectField({
  name,
  label,
  hint,
  children,
  ...props
}: BaseProps & Omit<ComponentProps<typeof NativeSelect>, "name" | "id" | "defaultValue">) {
  const { id, error, defaultValue, aria } = useField(name);
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <NativeSelect id={id} name={name} defaultValue={defaultValue} {...aria} {...props}>
        {children}
      </NativeSelect>
    </FormField>
  );
}
