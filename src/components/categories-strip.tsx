import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/queries";

export function CategoriesStrip() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  return (
    <section>
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Categorias</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/categoria/$slug"
            params={{ slug: c.slug }}
            className="flex flex-col items-center gap-2 shrink-0 w-16"
          >
            <div
              className="size-16 rounded-2xl grid place-items-center text-2xl ring-1 ring-border transition-transform active:scale-95"
              style={{ backgroundColor: c.bg_color ?? "var(--color-muted)" }}
            >
              {c.emoji}
            </div>
            <span className="text-[11px] font-medium text-center text-foreground leading-tight">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
