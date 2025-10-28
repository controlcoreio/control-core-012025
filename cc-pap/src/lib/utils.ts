
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCopyName(originalName: string, existingItems: Array<{ name: string }>): string {
  const baseName = originalName.replace(/ \(Copy( \d+)?\)$/, '');
  const copyRegex = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(Copy( (\\d+))?\\)$`);
  
  const copyNumbers = existingItems
    .map(item => item.name)
    .filter(name => copyRegex.test(name))
    .map(name => {
      const match = name.match(copyRegex);
      return match && match[2] ? parseInt(match[2]) : 1;
    })
    .filter(num => !isNaN(num));
  
  const copyNumber = copyNumbers.length === 0 ? 1 : Math.max(...copyNumbers) + 1;
  
  return copyNumber === 1 ? `${baseName} (Copy)` : `${baseName} (Copy ${copyNumber})`;
}

export function generateRandomString(length: number = 8): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
