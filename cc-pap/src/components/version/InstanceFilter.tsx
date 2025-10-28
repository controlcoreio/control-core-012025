
import React from "react";

interface Environment {
  value: string;
  label: string;
  tagColor: string;
}

interface InstanceFilterProps {
  value: string;
  onChange: (value: string) => void;
  environments: Environment[];
}

export function InstanceFilter({ value, onChange, environments }: InstanceFilterProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <label htmlFor="env-select" className="text-sm font-medium mr-1">
        Filter by Instance:
      </label>
      <select
        id="env-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded bg-background px-2 py-1"
      >
        <option value="all">All</option>
        {environments.map(env => (
          <option key={env.value} value={env.value}>
            {env.label}
          </option>
        ))}
      </select>
    </div>
  );
}
