// Cliente carrinho local (sem login). Persiste em localStorage.
const KEY = "tauan_cart_v1";

export type LocalCartItem = { product_id: string; quantity: number };

export function readLocalCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Validação de schema e garantia de quantidade positiva
    return parsed.filter(
      (i): i is LocalCartItem =>
        typeof i?.product_id === "string" && 
        typeof i?.quantity === "number" &&
        i.quantity > 0
    );
  } catch (e) {
    console.error("Erro ao ler carrinho local:", e);
    return [];
  }
}

export function writeLocalCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  // Garante que não salvamos itens inválidos ou com quantidade <= 0
  const validItems = items.filter(i => i.quantity > 0);
  window.localStorage.setItem(KEY, JSON.stringify(validItems));
  // Notifica o resto da app (React Query) que o carrinho mudou.
  window.dispatchEvent(new Event("local-cart-changed"));
}

export function addLocal(productId: string, qty = 1) {
  const items = readLocalCart();
  const idx = items.findIndex((i) => i.product_id === productId);
  if (idx >= 0) {
    items[idx].quantity += qty;
  } else {
    items.push({ product_id: productId, quantity: Math.max(1, qty) });
  }
  writeLocalCart(items);
}

export function setLocalQty(productId: string, qty: number) {
  const items = readLocalCart().filter((i) => i.product_id !== productId);
  if (qty > 0) {
    items.push({ product_id: productId, quantity: qty });
  }
  writeLocalCart(items);
}

export function clearLocal() {
  writeLocalCart([]);
}
