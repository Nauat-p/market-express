import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  bg_color: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  unit: string | null;
  image_url: string | null;
  stock: number;
  is_new: boolean;
  is_featured: boolean;
  sold_count: number;
};

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
};

export type Address = {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
});

export const featuredProductsQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .limit(12);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
    })) as Product[];
  },
});

export const offersQuery = queryOptions({
  queryKey: ["products", "offers"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("sale_price", "is", null)
      .order("sold_count", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
    })) as Product[];
  },
});

export const bestSellersQuery = queryOptions({
  queryKey: ["products", "best"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sold_count", { ascending: false })
      .limit(8);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
    })) as Product[];
  },
});

export const newProductsQuery = queryOptions({
  queryKey: ["products", "new"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_new", true)
      .limit(8);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
    })) as Product[];
  },
});

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        price: Number(data.price),
        sale_price: data.sale_price !== null ? Number(data.sale_price) : null,
      } as Product;
    },
  });

export const categoryBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data: cat, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!cat) return null;
      const { data: prods, error: pErr } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", cat.id)
        .order("sold_count", { ascending: false });
      if (pErr) throw pErr;
      return {
        category: cat as Category,
        products: (prods ?? []).map((p) => ({
          ...p,
          price: Number(p.price),
          sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
        })) as Product[],
      };
    },
  });

export const cartQuery = queryOptions({
  queryKey: ["cart"],
  queryFn: async (): Promise<CartItem[]> => {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, product:products(*)")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const p = row.product as Product;
      return {
        id: row.id,
        product_id: row.product_id,
        quantity: row.quantity,
        product: {
          ...p,
          price: Number(p.price),
          sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
        },
      };
    });
  },
});

export const addressesQuery = queryOptions({
  queryKey: ["addresses"],
  queryFn: async (): Promise<Address[]> => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Address[];
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const orderByCodeQuery = (code: string) =>
  queryOptions({
    queryKey: ["order", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const searchProductsQuery = (term: string) =>
  queryOptions({
    queryKey: ["search", term],
    enabled: term.trim().length > 1,
    queryFn: async (): Promise<Product[]> => {
      const q = term.trim();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        price: Number(p.price),
        sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
      })) as Product[];
    },
  });
