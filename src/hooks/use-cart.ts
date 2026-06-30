import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cartQuery, type CartItem, type Product } from "@/lib/queries";
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addLocal(product.id, quantity);
        return;
      }

      // Tenta fazer um upsert diretamente para evitar race conditions
      // A restrição UNIQUE(user_id, product_id) na tabela permite isso
      const { error } = await supabase.rpc('add_to_cart_v2', {
        p_user_id: user.id,
        p_product_id: product.id,
        p_quantity: quantity
      });

      // Se a função RPC não existir, cai no fallback (lógica original corrigida)
      if (error && error.code === 'PGRST501') {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("product_id", product.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          const { error: upErr } = await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id);
          if (upErr) throw upErr;
        } else {
          const { error: insErr } = await supabase
            .from("cart_items")
            .insert({ user_id: user.id, product_id: product.id, quantity });
          if (insErr) throw insErr;
        }
      } else if (error) {
        throw error;
      }
    },
    // Atualização otimista: o item aparece no carrinho imediatamente,
    // sem esperar a resposta do servidor. Isso elimina o atraso percebido
    // ao clicar para adicionar um produto.
    onMutate: async ({ product, quantity = 1 }) => {
      await qc.cancelQueries({ queryKey: cartQuery.queryKey });
      const previous = qc.getQueryData<CartItem[]>(cartQuery.queryKey);

      qc.setQueryData<CartItem[]>(cartQuery.queryKey, (old = []) => {
        const existing = old.find((c) => c.product_id === product.id);
        if (existing) {
          return old.map((c) =>
            c.product_id === product.id
              ? { ...c, quantity: c.quantity + quantity }
              : c
          );
        }
        return [
          ...old,
          {
            id: `optimistic-${product.id}`,
            product_id: product.id,
            quantity,
            product,
          },
        ];
      });

      return { previous };
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.product.name} adicionado ao carrinho`);
    },
    onError: (e: Error, _vars, context) => {
      console.error("Erro ao adicionar ao carrinho:", e);
      if (context?.previous) {
        qc.setQueryData(cartQuery.queryKey, context.previous);
      }
      toast.error("Não foi possível adicionar o item. Tente novamente.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cartQuery.queryKey });
    },
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
    // Atualização otimista: o +/- responde na hora, sem esperar o
    // round-trip de rede, evitando o atraso ao alterar a quantidade.
    onMutate: async ({ id, quantity }) => {
      await qc.cancelQueries({ queryKey: cartQuery.queryKey });
      const previous = qc.getQueryData<CartItem[]>(cartQuery.queryKey);

      qc.setQueryData<CartItem[]>(cartQuery.queryKey, (old = []) => {
        if (quantity <= 0) {
          return old.filter((c) => c.id !== id);
        }
        return old.map((c) => (c.id === id ? { ...c, quantity } : c));
      });

      return { previous };
    },
    onError: (e: Error, _vars, context) => {
      console.error("Erro ao atualizar quantidade:", e);
      if (context?.previous) {
        qc.setQueryData(cartQuery.queryKey, context.previous);
      }
      toast.error("Erro ao atualizar o carrinho.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: cartQuery.queryKey }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearLocal();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cartQuery.queryKey }),
  });
}

/**
 * Mescla o carrinho local no banco de forma atômica (se possível)
 */
export async function mergeLocalCartToDB() {
  const local = readLocalCart();
  if (local.length === 0) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Tenta usar uma função RPC para mesclagem em lote (batch merge)
    const { error } = await supabase.rpc('merge_cart_items', {
      p_user_id: user.id,
      p_items: local
    });

    // Fallback se o RPC não existir
    if (error && error.code === 'PGRST501') {
      for (const item of local) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("product_id", item.product_id)
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + item.quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }
    } else if (error) {
      throw error;
    }
    
    clearLocal();
  } catch (e) {
    console.error("Erro ao mesclar carrinho:", e);
    // Não limpamos o local se falhar para não perder dados do usuário
  }
}
