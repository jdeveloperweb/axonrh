import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma inteligente.
 * Usa clsx para condicionar classes e tailwind-merge para resolver conflitos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata CPF (000.000.000-00).
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (00.000.000/0000-00).
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Formata CEP (00000-000).
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata valor monetário.
 */
export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Formata data.
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const optionsMap: Record<'short' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
  };

  return new Intl.DateTimeFormat('pt-BR', optionsMap[format]).format(d);
}

/**
 * Formata hora.
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Valida CPF.
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;

  return digit === parseInt(cleaned.charAt(10));
}

/**
 * Valida CNPJ.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return digit === parseInt(cleaned.charAt(13));
}

/**
 * Valida email.
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Gera iniciais do nome.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Debounce function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Trunca texto.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Sleep/delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera ID único.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Alias for formatCPF (lowercase).
 */
export const formatCpf = formatCPF;

/**
 * Alias for formatCNPJ (lowercase).
 */
export const formatCnpj = formatCNPJ;

/**
 * Alias for formatCEP (lowercase).
 */
export const formatCep = formatCEP;

/**
 * Alias for isValidCPF (lowercase).
 */
export const isValidCpf = isValidCPF;

/**
 * Alias for isValidCNPJ (lowercase).
 */
export const isValidCnpj = isValidCNPJ;

/**
 * Format date and time to Brazilian format (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format time difference as relative string (e.g., "2 horas atrás")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour} hora${diffHour > 1 ? 's' : ''} atrás`;
  if (diffDay < 7) return `${diffDay} dia${diffDay > 1 ? 's' : ''} atrás`;

  return formatDate(d);
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns full photo URL
 */
export function getPhotoUrl(path: string | null | undefined, updatedAt?: string | Date): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  // Normaliza o path: se for um path antigo de uploads, converte para o novo path da API
  // que sabemos que o gateway roteia corretamente sem autenticação.
  let cleanPath = path;
  if (path.startsWith('/uploads/employee-photos/')) {
    cleanPath = path.replace('/uploads/employee-photos/', '/api/v1/employees/photos/');
  }

  // Determina a base URL
  let baseUrl = '';

  if (process.env.NEXT_PUBLIC_API_URL) {
    // Se temos a env var, removemos o /api/v1 e usamos como base
    baseUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '');
  } else if (typeof window !== 'undefined') {
    // Se no browser e sem env var, verifica se estamos no localhost
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Localmente fora do docker, os serviços costumam estar na porta 8180 ou via gateway na 8080
      // Tentamos o padrão do projeto
      baseUrl = 'http://localhost:8180';
    } else {
      // Na internet, se não temos a base setada, usamos caminhos relativos ao domínio atual
      baseUrl = '';
    }
  } else {
    // Fallback padrão se tudo falhar (e.g. Server Side Rendering sem env var)
    baseUrl = 'http://localhost:8180';
  }

  // Constrói a URL final
  const url = `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;

  if (updatedAt) {
    const t = typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : new Date(updatedAt).getTime();
    if (!isNaN(t)) {
      return `${url}${url.includes('?') ? '&' : '?'}v=${t}`;
    }
  }

  return url;
}

