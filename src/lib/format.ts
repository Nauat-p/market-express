export const formatBRL = (value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
};

export const calcDiscount = (price: number, sale: number | null | undefined): number => {
  if (!sale || sale >= price) return 0;
  return Math.round(((price - sale) / price) * 100);
};

export const effectivePrice = (price: number, sale: number | null | undefined): number =>
  sale && sale < price ? sale : price;

export const greetingPT = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};
