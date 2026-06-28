-- ============ SHOPPING LISTS ============
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(list_id, product_id)
);

CREATE INDEX shopping_lists_user_idx ON public.shopping_lists(user_id);
CREATE INDEX shopping_list_items_list_idx ON public.shopping_list_items(list_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_list_items TO authenticated;
GRANT ALL ON public.shopping_lists TO service_role;
GRANT ALL ON public.shopping_list_items TO service_role;

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own shopping lists" ON public.shopping_lists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own list items" ON public.shopping_list_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid()));

CREATE TRIGGER touch_shopping_lists BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
