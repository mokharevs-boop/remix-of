import { Minus, Pencil, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import {
  formatGuestCalculation,
  formatPrice,
  formatPriceBreakdown,
  formatQuantityWithUnit,
  formatUnitLabel,
  formatWeight,
  getLineTotal,
  getQuantityStep,
  normalizeQuantity,
  type CartItem,
} from "./cart-types";

type CartProps = {
  items: CartItem[];
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  onCheckout?: () => void;
  onCommentChange?: (sku: string, comment: string) => void;
};

export function Cart({
  items,
  onQuantityChange,
  onRemove,
  onCheckout,
  onCommentChange,
}: CartProps) {

  const itemsTotal = items.reduce((sum, i) => sum + getLineTotal(i), 0);
  const totalWeight = items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const discountTotal = items.reduce((sum, i) => sum + (i.discount ?? 0) * i.quantity, 0);
  const payable = Math.max(0, itemsTotal - discountTotal);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Ліва колонка — список товарів */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">Ваш кошик</h3>
          <span className="text-sm text-muted-foreground">{totalQty} позицій</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-14 text-center">
            <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Кошик порожній. Опишіть подію вище — ШІ підбере страви та додасть їх сюди.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item, index) => (
              <li key={`${item.sku}-${index}`} className="py-4">
                <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-2xl">
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

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatUnitLabel(item)} · SKU {item.sku}
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <button
                    type="button"
                    aria-label={`Зменшити кількість ${item.name}`}
                    onClick={() => onQuantityChange(item.sku, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Збільшити кількість ${item.name}`}
                    onClick={() => onQuantityChange(item.sku, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="w-32 text-right">
                  <div className="font-display font-bold text-brand-green">
                    {formatPrice(getLineTotal(item))}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatPriceBreakdown(item)}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Видалити ${item.name}`}
                  onClick={() => onRemove(item.sku)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>

                <div className="mt-3 sm:pl-20">
                  <label
                    htmlFor={`cart-comment-${item.sku}`}
                    className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5 text-brand-orange" />
                    Коментар для збиральника Сільпо
                  </label>
                  <textarea
                    id={`cart-comment-${item.sku}`}
                    rows={2}
                    value={item.pickerComment ?? ""}
                    onChange={(e) => onCommentChange?.(item.sku, e.target.value)}
                    placeholder="Напр.: покласти 10 окремих тістечок по 100 г"
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none transition focus:border-brand-green"
                  />
                </div>
              </li>

            ))}
          </ul>
        )}
      </div>

      {/* Права колонка — деталі замовлення */}
      <aside className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
        <h3 className="font-display text-lg font-bold">Деталі замовлення</h3>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Товари ({totalQty})</dt>
            <dd className="font-semibold">{formatPrice(itemsTotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Загальна вага</dt>
            <dd className="font-semibold">{formatWeight(totalWeight)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Сума знижки</dt>
            <dd className="font-semibold text-brand-orange">−{formatPrice(discountTotal)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
          <span className="text-sm font-medium text-muted-foreground">До оплати</span>
          <span className="font-display text-2xl font-bold">{formatPrice(payable)}</span>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold btn-hero disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingBasket className="h-4 w-4" />
          {items.length === 0 ? "До покупок" : "Оплатити"}
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Оплата онлайн або при отриманні. Доставка від 500 ₴ — безкоштовно.
        </p>
      </aside>
    </div>
  );
}
