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

      const { data, error } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name })
        .select()
        .single();                      // ← agora retorna o registro criado
      if (error) throw error;
      return data;                      // ← id disponível no onSuccess
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista criada!");
    },
  });

  const addItemToList = useMutation({
    mutationFn: async ({
      listId,
      productId,
      quantity = 1,
    }: {
      listId: string;
      productId: string;
      quantity?: number;
    }) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .upsert(
          { list_id: listId, product_id: productId, quantity },
          { onConflict: "list_id,product_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Item adicionado à lista!");
    },
    onError: () => {
      toast.error("Não foi possível adicionar o item.");
    },
  });

  /** Cria lista e já adiciona um produto de uma só vez. */
  const createListWithProduct = useMutation({
    mutationFn: async ({
      name,
      productId,
      quantity = 1,
    }: {
      name: string;
      productId: string;
      quantity?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Entre para criar listas");

      const { data: list, error: listErr } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (listErr) throw listErr;

      const { error: itemErr } = await supabase
        .from("shopping_list_items")
        .insert({ list_id: list.id, product_id: productId, quantity });
      if (itemErr) throw itemErr;

      return list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista criada com o produto!");
    },
  });

  const createFromCart = useMutation({
    mutationFn: async ({
      name,
      items,
    }: {
      name: string;
      items: { product_id: string; quantity: number }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");

      const { data: list, error: listErr } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (listErr) throw listErr;

      const listItems = items.map((i) => ({
        list_id: list.id,
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      const { error: itemsErr } = await supabase
        .from("shopping_list_items")
        .insert(listItems);
      if (itemsErr) throw itemsErr;

      return list;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista criada a partir do carrinho!");
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
    },
  });

  const updateItemQuantity = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ quantity })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from("shopping_lists")
        .delete()
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
      toast.success("Lista excluída");
    },
  });

  const renameList = useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ name })
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingListsQuery.queryKey });
    },
  });

  return {
    lists,
    isLoading,
    createList,
    createListWithProduct,   // ← novo
    addItemToList,
    createFromCart,
    removeItem,
    updateItemQuantity,
    deleteList,
    renameList,
  };
}
