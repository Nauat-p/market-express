/**
 * Utilitários para máscaras de entrada
 */

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
}

export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 14);
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{2})$/, "$1-$2")
    .slice(0, 14);
}

export function maskCurrency(value: string): string {
  const numericValue = value.replace(/\D/g, "");
  const numberValue = parseInt(numericValue || "0", 10);
  return (numberValue / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function unmaskCurrency(value: string): number {
  const numericValue = value.replace(/\D/g, "");
  return parseInt(numericValue || "0", 10) / 100;
}

/**
 * Validadores
 */

export function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, "");
  return cleanCEP.length === 8;
}

export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11), 10)) return false;

  return true;
}
