import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shoppingListsQuery, type Product } from "@/lib/queries";
import { toast } from "sonner";

export function useShoppingLists() {
  const qc = useQueryClient();
  const { data: lists = [], isLoading } = useQuery(shoppingListsQuery);

  const createList = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Entre para criar listas");
      
      const { error } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista criada!");
    }
  });

  const addItemToList = useMutation({
    mutationFn: async ({ listId, productId, quantity = 1 }: { listId: string, productId: string, quantity?: number }) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .upsert({ list_id: listId, product_id: productId, quantity }, { onConflict: 'list_id,product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Item adicionado à lista");
    }
  });

  const createFromCart = useMutation({
    mutationFn: async ({ name, items }: { name: string, items: { product_id: string, quantity: number }[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      const { data: list, error: listErr } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      
      if (listErr) throw listErr;

      const listItems = items.map(i => ({
        list_id: list.id,
        product_id: i.product_id,
        quantity: i.quantity
      }));

      const { error: itemsErr } = await supabase.from("shopping_list_items").insert(listItems);
      if (itemsErr) throw itemsErr;
      
      return list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista criada a partir do carrinho!");
    }
  });

  return { lists, isLoading, createList, addItemToList, createFromCart };
}
