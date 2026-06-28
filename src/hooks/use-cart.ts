import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cartQuery, type Product } from "@/lib/queries";
import { toast } from "sonner";
import {
  addLocal,
  setLocalQty,
  clearLocal,
  readLocalCart,
} from "@/lib/local-cart";

async function isSignedIn() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      product,
      quantity = 1,
    }: {
      product: Product;
      quantity?: number;
    }) => {
      if (!(await isSignedIn())) {
        addLocal(product.id, quantity);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        addLocal(product.id, quantity);
        return;
      }

      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: auth.user.id, product_id: product.id, quantity });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: cartQuery.queryKey });
      toast.success(`${vars.product.name} no carrinho`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCartQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      productId,
      quantity,
    }: {
      id: string;
      productId?: string;
      quantity: number;
    }) => {
      // Itens locais têm id no formato `local-<productId>`.
      if (id.startsWith("local-")) {
        const pid = productId ?? id.replace(/^local-/, "");
        setLocalQty(pid, quantity);
        return;
      }
      if (quantity <= 0) {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartQuery.queryKey }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearLocal();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartQuery.queryKey }),
  });
}

// Mescla o carrinho local no banco após o login.
export async function mergeLocalCartToDB() {
  const local = readLocalCart();
  if (local.length === 0) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  for (const item of local) {
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("product_id", item.product_id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + item.quantity })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        user_id: auth.user.id,
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }
  }
  clearLocal();
}
