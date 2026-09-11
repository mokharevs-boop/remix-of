import { useState } from "react";
import { Minus, Pencil, Plus, ShoppingBasket, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatPrice,
  formatPriceBreakdown,
  formatUnitLabel,
  getLineTotal,
  isPieceItem,
  type CartItem,
} from "./cart-types";

const CHECKOUT_URL =
  "https://n8n58127.hostkey.in/webhook/oplis-mcp-agent-checkout";
const CHECKOUT_BRANCH_ID = "1edb6b5a-55fb-6864-9a0f-d54e0a9fe643";
const CHECKOUT_COMPANY_ID = "1ec88c5d-a050-669c-8467-570a157f3e31";
const PAYMENT_URL_REGEX = /https:\/\/silpo\.ua\/checkout-new[^\s"']+/;

type CartSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  onCommentChange?: (sku: string, comment: string) => void;
};

export function CartSheet({
  open,
  onOpenChange,
  items,
  onQuantityChange,
  onRemove,
  onCommentChange,
}: CartSheetProps) {
  const total = items.reduce((sum, i) => sum + getLineTotal(i), 0);
  const discountTotal = items.reduce((sum, i) => sum + (i.discount ?? 0) * i.quantity, 0);
  const payable = Math.max(0, total - discountTotal);

  const step = (item: CartItem, direction: 1 | -1) => {
    const delta = isPieceItem(item) ? 1 : 0.1;
    const next = Number((item.quantity + delta * direction).toFixed(2));
    onQuantityChange(item.sku, next);
  };

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (isCheckingOut || items.length === 0) return;
    setIsCheckingOut(true);

    try {
      const payload = {
        branchId: CHECKOUT_BRANCH_ID,
        items: items.map((item) => ({
          productId: item.sku,
          quantity: item.quantity,
          companyId: CHECKOUT_COMPANY_ID,
        })),
      };

      const response = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const urlMatch =
        typeof data === "string"
          ? data.match(PAYMENT_URL_REGEX)
          : JSON.stringify(data).match(PAYMENT_URL_REGEX);

      if (urlMatch && urlMatch[0]) {
        window.location.href = urlMatch[0];
        return;
      }

      throw new Error("Payment URL not found in response");
    } catch {
      setIsCheckingOut(false);
      toast.error("Сталася помилка при синхронізації кошика. Спробуйте ще раз.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-lg">Ваш кошик</SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? "Поки що порожньо — додайте страви зі згенерованого меню."
              : `${items.length} позицій · ${formatPrice(payable)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
              <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Опишіть подію у полі на головній — ШІ підбере страви.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.sku} className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-xl">
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
                      <div className="font-semibold leading-snug">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatUnitLabel(item)}
                      </div>
                      <div className="mt-1 font-display font-bold text-brand-green">
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
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-border p-1">
                      <button
                        type="button"
                        aria-label={`Зменшити кількість ${item.name}`}
                        onClick={() => step(item, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-14 text-center text-xs font-semibold">
                        {isPieceItem(item)
                          ? `${Math.round(item.quantity)} шт`
                          : `${item.quantity.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} кг`}
                      </span>
                      <button
                        type="button"
                        aria-label={`Збільшити кількість ${item.name}`}
                        onClick={() => step(item, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label
                      htmlFor={`sheet-comment-${item.sku}`}
                      className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5 text-brand-orange" />
                      Коментар для збиральника
                    </label>
                    <textarea
                      id={`sheet-comment-${item.sku}`}
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

        <div className="border-t border-border bg-card px-5 py-4">
          {discountTotal > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Знижка</span>
              <span className="font-semibold text-brand-orange">
                −{formatPrice(discountTotal)}
              </span>
            </div>
          )}
          <div className="mb-4 flex items-end justify-between">
            <span className="text-sm font-medium text-muted-foreground">До оплати</span>
            <span className="font-display text-2xl font-bold">{formatPrice(payable)}</span>
          </div>
          <button
            type="button"
            onClick={checkout}
            disabled={items.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-semibold btn-hero disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShoppingBasket className="h-4 w-4" />
            Оформити замовлення
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
