
import { Policy } from "./types";

export const generateCopyName = (originalName: string, policies: Policy[]) => {
  const basePrefix = "Copy of";
  const existingCopies = policies.filter(p => 
    p.name.startsWith(basePrefix) && p.name.includes(originalName)
  );

  if (existingCopies.length === 0) {
    return `${basePrefix} ${originalName}`;
  }

  const nextNumber = existingCopies.length;
  return `${basePrefix} ${String(nextNumber).padStart(2, '0')} ${originalName}`;
};
