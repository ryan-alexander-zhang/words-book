"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextFormProps {
  placeholder: string;
  annotationPlaceholder: string;
  buttonLabel: string;
  onAdd: (content: string, annotation: string) => Promise<void>;
}

export function TextForm({
  placeholder,
  annotationPlaceholder,
  buttonLabel,
  onAdd
}: TextFormProps) {
  const [value, setValue] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await onAdd(value.trim(), annotation.trim());
      setValue("");
      setAnnotation("");
    } catch {
      setError("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Input
          placeholder={annotationPlaceholder}
          value={annotation}
          onChange={(event) => setAnnotation(event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : buttonLabel}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
