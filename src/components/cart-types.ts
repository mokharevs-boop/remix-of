export type CartItem = {
  sku: string;
  name: string;
  price: number;
  weight: number; // грам за одиницю (для старої вагової моделі)
  quantity: number;
  packaging?: string;
  image?: string;
  discount?: number; // сума знижки за одиницю, ₴
  emoji?: string;
  pickerComment?: string; // коментар для збиральника
  pieces?: number; // кількість штук у позиції (для вагових товарів)
  unit?: string; // одиниця виміру: kg, g, pcs...
  unit_price?: number; // ціна за одну одиницю (за шт або за кг)
};


const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/** Дістає масив товарів з довільної відповіді вебхука. */
export function parseCartItems(payload: unknown): CartItem[] {
  let raw: unknown = payload;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    raw = obj.items ?? obj.products ?? obj.cart ?? obj.data ?? obj.output ?? [];
  }
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry, index) => {
      const sku = String(entry.sku ?? entry.SKU ?? entry.id ?? `item-${index}`);
      const name = String(entry.name ?? entry.title ?? entry.product ?? "Товар");
      const unit = typeof entry.unit === "string" ? entry.unit : undefined;
      const isWeightUnit = /^(kg|кг|kilogram|г|грам|grams?|g)$/i.test(unit ?? "");
      const rawQty = toNumber(entry.quantity ?? entry.qty ?? 1);
      const quantity = isWeightUnit
        ? Math.max(0.01, rawQty)
        : Math.max(1, Math.round(rawQty) || 1);
      return {
        sku,
        name,
        price: toNumber(entry.price ?? entry.cost ?? 0),
        weight: toNumber(entry.weight ?? entry.grams ?? 0),
        quantity,
        packaging:
          typeof entry.packaging === "string"
            ? entry.packaging
            : typeof entry.package === "string"
              ? (entry.package as string)
              : undefined,
        image: typeof entry.image === "string" ? entry.image : undefined,
        discount: toNumber(entry.discount ?? 0),
        emoji: typeof entry.emoji === "string" ? entry.emoji : undefined,
        pickerComment:
          typeof entry.picker_comment === "string"
            ? (entry.picker_comment as string)
            : typeof entry.pickerComment === "string"
              ? (entry.pickerComment as string)
              : typeof entry.comment === "string"
                ? (entry.comment as string)
                : undefined,
        pieces: toNumber(entry.pieces ?? entry.pcs ?? entry.units ?? 0) || undefined,
        unit,
        unit_price: toNumber(entry.unit_price ?? entry.unitPrice ?? 0) || undefined,
      } satisfies CartItem;
    })
    .filter((item) => item.name.length > 0);

}

export function mergeCartItems(current: CartItem[], incoming: CartItem[]): CartItem[] {
  const next = current.map((item) => ({ ...item }));
  for (const item of incoming) {
    const existing = next.find((i) => i.sku === item.sku);
    if (existing) {
      existing.quantity += item.quantity;
      if (item.pickerComment) existing.pickerComment = item.pickerComment;
    } else next.push({ ...item });

  }
  return next;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} кг`;
  return `${Math.round(grams)} г`;
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₴`;
}

export type MenuCategory = {
  id: string;
  title: string;
  description?: string;
  items: CartItem[];
};

/** Розбирає структурований JSON з масивом categories у категорії з товарами. */
export function parseMenuCategories(payload: unknown): MenuCategory[] {
  let raw: unknown = payload;

  if (Array.isArray(raw) && raw.length > 0 && raw[0] && typeof raw[0] === "object") {
    const first = raw[0] as Record<string, unknown>;
    if (first.categories || first.output || first.data) raw = first;
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const nested = obj.categories ?? obj.output ?? obj.data ?? obj.menu ?? obj.result;
    raw = nested ?? [];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const inner = raw as Record<string, unknown>;
      raw = inner.categories ?? [];
    }
  }
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry, index) => {
      const title = String(
        entry.category_name ??
          entry.category ??
          entry.name ??
          entry.title ??
          `Категорія ${index + 1}`,
      );
      const itemsRaw = entry.items ?? entry.products ?? entry.dishes ?? [];
      return {
        id: String(entry.id ?? title ?? index),
        title,
        description:
          typeof entry.description === "string" ? (entry.description as string) : undefined,
        items: parseCartItems(itemsRaw),
      } satisfies MenuCategory;
    })
    .filter((category) => category.items.length > 0);
}

/** Визначає, чи товар є штучним (піца, бургер, сендвіч тощо). */
export function isPieceItem(item: CartItem): boolean {
  const unit = (item.unit ?? "").toLowerCase();
  if (
    /^(шт|pcs|pieces?|piece|піца|піци|бургер|сендвіч|sandwich|burger|pizza|item|unit|порція)$/i.test(
      unit,
    )
  ) {
    return true;
  }
  if (/^(kg|кг|kilogram|г|грам|grams?|g)$/i.test(unit)) {
    return false;
  }
  return !(item.weight > 0);
}

/** Кількість з одиницею виміру: "10 шт" або "0.27 кг". */
export function formatQuantityWithUnit(item: CartItem): string {
  if (isPieceItem(item)) {
    return `${Math.round(item.quantity)} шт`;
  }
  const qty = item.quantity || 0;
  const hasFraction = qty % 1 !== 0;
  return `${qty.toLocaleString("uk-UA", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })} кг`;
}

/** Зрозуміла вага/кількість штук: "1 кг (10 шт)". */
export function formatUnitLabel(item: CartItem): string {
  const parts: string[] = [];
  if (item.weight > 0) parts.push(formatWeight(item.weight));
  else if (item.packaging) parts.push(item.packaging);
  if (item.pieces && item.pieces > 0) parts.push(`${Math.round(item.pieces)} шт`);
  if (parts.length === 0) return item.packaging ?? "1 порція";
  return parts.length > 1 ? `${parts[0]} (${parts[1]})` : parts[0];
}

/** Чи ціна товару вказана за кілограм (ваговий товар). */
export function isWeightPriced(item: CartItem): boolean {
  return item.weight > 0 && /^(kg|кг|kilogram)$/i.test(item.unit ?? "kg");
}

/** Вартість однієї порції: для вагових — ціна за кг × вага порції. */
export function getPortionPrice(item: CartItem): number {
  if (isWeightPriced(item)) return item.price * (item.weight / 1000);
  return item.price;
}

/** Підсумкова вартість позиції. Якщо є unit_price — item.price вже підсумкова. */
export function getLineTotal(item: CartItem): number {
  if (item.unit_price && item.unit_price > 0) return item.price;
  return getPortionPrice(item) * item.quantity;
}

/** Підпис під сумою: "за 0.27 кг (889 грн/кг)" або "за 10 шт (120 грн/шт)". */
export function formatPriceBreakdown(item: CartItem): string {
  if (item.unit_price && item.unit_price > 0) {
    const unitPrice = item.unit_price.toLocaleString("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (isPieceItem(item)) {
      return `за ${Math.round(item.quantity)} шт (${unitPrice} грн/шт)`;
    }
    const qty = item.quantity.toLocaleString("uk-UA", {
      minimumFractionDigits: item.quantity % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return `за ${qty} кг (${unitPrice} грн/кг)`;
  }

  if (isWeightPriced(item)) {
    const kg = item.weight / 1000;
    const kgLabel = `${kg.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} кг`;
    const per = `${item.price.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} ₴/кг`;
    const pieces = item.pieces && item.pieces > 0 ? `, ${Math.round(item.pieces)} шт` : "";
    return `за ${kgLabel} (${per}${pieces})`;
  }

  return `за ${formatUnitLabel(item)} · ${formatPrice(item.price)}`;
}
