export type CartItem = {
  sku: string;
  name: string;
  price: number;
  weight: number; // грам за одиницю
  quantity: number;
  packaging?: string;
  image?: string;
  discount?: number; // сума знижки за одиницю, ₴
  emoji?: string;
  pickerComment?: string; // коментар для збиральника
  pieces?: number; // кількість штук у позиції (для вагових товарів)
  unit?: string; // одиниця виміру: kg, g, pcs...
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
      const quantity = Math.max(1, Math.round(toNumber(entry.quantity ?? entry.qty ?? 1)) || 1);
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
      } satisfies CartItem;
    })
    .filter((item) => item.name.length > 0);
}

export function mergeCartItems(current: CartItem[], incoming: CartItem[]): CartItem[] {
  const next = current.map((item) => ({ ...item }));
  for (const item of incoming) {
    const existing = next.find((i) => i.sku === item.sku);
    if (existing) existing.quantity += item.quantity;
    else next.push({ ...item });
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
        entry.category ?? entry.name ?? entry.title ?? `Категорія ${index + 1}`,
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
