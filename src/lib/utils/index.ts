import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAssessmentGrade(
  theory: number,
  practical: number,
  project: number,
  creativity: number,
  participation: number
) {
  // Clamping
  const clampedTheory = Math.min(Math.max(0, theory || 0), 20);
  const clampedPractical = Math.min(Math.max(0, practical || 0), 30);
  const clampedProject = Math.min(Math.max(0, project || 0), 30);
  const clampedCreativity = Math.min(Math.max(0, creativity || 0), 10);
  const clampedParticipation = Math.min(Math.max(0, participation || 0), 10);

  const total = Number((clampedTheory + clampedPractical + clampedProject + clampedCreativity + clampedParticipation).toFixed(2));
  const percentage = Number(((total / 100) * 100).toFixed(2));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  let performance_category: 'Exemplary' | 'Proficient' | 'Developing' | 'Needs Support' = 'Needs Support';

  if (percentage >= 90) {
    grade = 'A+';
    performance_category = 'Exemplary';
  } else if (percentage >= 80) {
    grade = 'A';
    performance_category = 'Proficient';
  } else if (percentage >= 70) {
    grade = 'B';
    performance_category = 'Proficient';
  } else if (percentage >= 60) {
    grade = 'C';
    performance_category = 'Developing';
  } else if (percentage >= 50) {
    grade = 'D';
    performance_category = 'Needs Support';
  } else {
    grade = 'F';
    performance_category = 'Needs Support';
  }

  return {
    theory: clampedTheory,
    practical: clampedPractical,
    project: clampedProject,
    creativity: clampedCreativity,
    participation: clampedParticipation,
    total,
    percentage,
    grade,
    performance_category,
  };
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
