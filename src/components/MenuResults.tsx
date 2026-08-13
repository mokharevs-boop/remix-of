import { Pencil, Plus, Sparkles } from "lucide-react";
import { formatPrice, formatUnitLabel, type CartItem, type MenuCategory } from "./cart-types";

type MenuResultsProps = {
  categories: MenuCategory[];
  onAddItem: (item: CartItem) => void;
  onAddCategory: (category: MenuCategory) => void;
  onCommentChange?: (categoryId: string, sku: string, comment: string) => void;
};

export function MenuResults({
  categories,
  onAddItem,
  onAddCategory,
  onCommentChange,
}: MenuResultsProps) {
  if (categories.length === 0) return null;


  const total = categories.reduce(
    (sum, category) =>
      sum + category.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    0,
  );

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-green/30 bg-card p-4 shadow-[var(--shadow-card)]">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand-orange" />
          ШІ підібрав {categories.length} категорій меню
        </p>
        <span className="font-display text-lg font-bold text-brand-green">
          {formatPrice(total)}
        </span>
      </div>

      {categories.map((category) => (
        <section
          key={category.id}
          className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">{category.title}</h3>
              {category.description && (
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onAddCategory(category)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/40 px-3 py-1.5 text-xs font-semibold text-brand-green transition hover:bg-brand-green/10"
            >
              <Plus className="h-3.5 w-3.5" /> Додати всі
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.items.map((item) => (
              <li
                key={`${category.id}-${item.sku}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-xl">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span aria-hidden="true">{item.emoji ?? "🍽️"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold leading-snug">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatUnitLabel(item)}
                      {" · "}
                      {item.quantity} шт
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`comment-${category.id}-${item.sku}`}
                    className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5 text-brand-orange" />
                    Коментар для збиральника Сільпо
                  </label>
                  <textarea
                    id={`comment-${category.id}-${item.sku}`}
                    rows={2}
                    value={item.pickerComment ?? ""}
                    onChange={(e) => onCommentChange?.(category.id, item.sku, e.target.value)}
                    placeholder="Напр.: покласти 10 окремих тістечок по 100 г"
                    className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none transition focus:border-brand-green"
                  />
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div>
                    <span className="font-display font-bold text-brand-green">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <div className="text-[11px] text-muted-foreground">{formatUnitLabel(item)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddItem(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold btn-hero"
                  >
                    <Plus className="h-3.5 w-3.5" /> В кошик
                  </button>
                </div>

              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
