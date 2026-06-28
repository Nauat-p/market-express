import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { favoritesQuery } from "@/lib/queries";
import { toast } from "sonner";

export function useFavorites() {
  const qc = useQueryClient();
  const { data: favorites = [] } = useQuery(favoritesQuery);

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Entre para favoritar produtos");

      const isFav = favorites.some(p => p.id === productId);

      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: favoritesQuery.queryKey });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    }
  });

  return { favorites, toggle, isFavorite: (id: string) => favorites.some(p => p.id === id) };
}
