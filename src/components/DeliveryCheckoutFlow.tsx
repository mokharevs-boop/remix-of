import { useMemo, useState } from "react";
import { Check, LoaderCircle, MapPin, Store, Truck, Clock } from "lucide-react";
import { toast } from "sonner";

export type DeliveryPayload = {
  addressType: "self-pickup" | "house";
  deliveryType: "SelfPickup" | "DeliveryHome";
  branchId: string;
  latitude?: number;
  longitude?: number;
  city: string;
  street: string;
  house?: string;
  timeslot: { start: string; end: string };
};

type Branch = {
  branchId: string;
  city: string;
  street: string;
  house: string;
  latitude: number;
  longitude: number;
};

export const SILPO_BRANCHES: Branch[] = [
  {
    branchId: "1edb6b5a-55fb-6864-9a0f-d54e0a9fe643",
    city: "Івано-Франківськ",
    street: "вул. Мазепи",
    house: "168А",
    latitude: 48.9226,
    longitude: 24.7111,
  },
  {
    branchId: "1edb6b5a-b1b0-611e-a929-d11f2666a570",
    city: "Івано-Франківськ",
    street: "вул. Дністровська",
    house: "3",
    latitude: 48.9155,
    longitude: 24.7075,
  },
  {
    branchId: "1edb6b5b-831e-60fc-bf42-a302e997617d",
    city: "Чернівці",
    street: "вул. Героїв Майдану",
    house: "71",
    latitude: 48.2795,
    longitude: 25.9515,
  },
];

const branchLabel = (b: Branch) => `${b.city}, ${b.street}, ${b.house}`;

type Slot = { start: string; end: string; label: string };

/** Генерує доступні вікна на найближчі 2 дні (2-годинні інтервали). */
function buildTimeSlots(): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  for (let day = 0; day < 2; day += 1) {
    for (const hour of [10, 12, 14, 16, 18]) {
      const start = new Date(now);
      start.setDate(now.getDate() + day);
      start.setHours(hour, 0, 0, 0);
      if (start.getTime() < now.getTime() + 60 * 60 * 1000) continue;
      const end = new Date(start);
      end.setHours(hour + 2);
      const dayLabel = start.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        label: `${dayLabel}, ${String(hour).padStart(2, "0")}:00 – ${String(hour + 2).padStart(2, "0")}:00`,
      });
    }
  }
  return slots;
}

type Props = {
  onSubmit?: (payload: DeliveryPayload) => void;
  disabled?: boolean;
};

export function DeliveryCheckoutFlow({ onSubmit, disabled }: Props) {
  const [addressType, setAddressType] = useState<"self-pickup" | "house">("self-pickup");
  const deliveryType = addressType === "self-pickup" ? "SelfPickup" : "DeliveryHome";

  // самовивіз
  const [pickupBranchId, setPickupBranchId] = useState("");

  // доставка
  const [city, setCity] = useState("Івано-Франківськ");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    branchId: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressError, setAddressError] = useState("");

  const [slotStart, setSlotStart] = useState("");
  const slots = useMemo(() => buildTimeSlots(), []);

  const cities = useMemo(() => Array.from(new Set(SILPO_BRANCHES.map((b) => b.city))), []);

  const resetSlot = () => setSlotStart("");

  const slotEnabled =
    addressType === "self-pickup" ? Boolean(pickupBranchId) : Boolean(confirmed);

  /** Імітація silpo_find_address: знаходить найближчу філію в місті. */
  const confirmAddress = async () => {
    if (!street.trim() || !houseNumber.trim()) {
      setAddressError("Вкажіть вулицю та номер будинку.");
      return;
    }
    setAddressError("");
    setIsValidating(true);
    resetSlot();
    await new Promise((r) => setTimeout(r, 900));
    const branch = SILPO_BRANCHES.find((b) => b.city === city) ?? SILPO_BRANCHES[0];
    setConfirmed({
      branchId: branch.branchId,
      latitude: Number((branch.latitude + 0.0031).toFixed(4)),
      longitude: Number((branch.longitude + 0.0024).toFixed(4)),
    });
    setIsValidating(false);
    toast.success("Адресу підтверджено", {
      description: `Обслуговує «Сільпо» ${branchLabel(branch)}`,
    });
  };

  const selectedSlot = slots.find((s) => s.start === slotStart);
  const ready = slotEnabled && Boolean(selectedSlot);

  const buildPayload = (): DeliveryPayload | null => {
    if (!selectedSlot) return null;
    if (addressType === "self-pickup") {
      const branch = SILPO_BRANCHES.find((b) => b.branchId === pickupBranchId);
      if (!branch) return null;
      return {
        addressType: "self-pickup",
        deliveryType: "SelfPickup",
        branchId: branch.branchId,
        latitude: branch.latitude,
        longitude: branch.longitude,
        city: branch.city,
        street: branch.street,
        house: branch.house,
        timeslot: { start: selectedSlot.start, end: selectedSlot.end },
      };
    }
    if (!confirmed) return null;
    return {
      addressType: "house",
      deliveryType: "DeliveryHome",
      branchId: confirmed.branchId,
      latitude: confirmed.latitude,
      longitude: confirmed.longitude,
      city,
      street: street.trim(),
      house: houseNumber.trim(),
      timeslot: { start: selectedSlot.start, end: selectedSlot.end },
    };
  };

  const [payload, setPayload] = useState<DeliveryPayload | null>(null);

  const submit = () => {
    const next = buildPayload();
    if (!next) return;
    setPayload(next);
    onSubmit?.(next);
    toast.success(
      next.deliveryType === "SelfPickup" ? "Самовивіз оформлено" : "Доставку оформлено",
      { description: "Дані передані технологу Власного Виробництва." },
    );
  };

  const optionClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
      active
        ? "border-brand-orange bg-brand-orange/5 shadow-[var(--shadow-warm)]"
        : "border-border bg-card hover:border-brand-orange/50"
    }`;

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand-orange disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-orange">
          Крок 2
        </span>
        <h3 className="mt-2 font-display text-2xl font-bold">Отримання замовлення</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Оберіть спосіб отримання, підтвердіть адресу та зручний часовий інтервал.
        </p>
      </div>

      {/* Крок 1 — тип отримання */}
      <fieldset className="flex flex-col gap-3 sm:flex-row" disabled={disabled}>
        <legend className="sr-only">Тип отримання</legend>
        <label className={optionClass(addressType === "self-pickup")}>
          <input
            type="radio"
            name="addressType"
            value="self-pickup"
            checked={addressType === "self-pickup"}
            onChange={() => {
              setAddressType("self-pickup");
              resetSlot();
            }}
            className="mt-1 h-4 w-4 accent-[var(--brand-orange)]"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold">
              <Store className="h-4 w-4 text-brand-orange" /> Самовивіз із супермаркету
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Заберіть готове замовлення у «Сільпо» без черг
            </span>
          </span>
        </label>

        <label className={optionClass(addressType === "house")}>
          <input
            type="radio"
            name="addressType"
            value="house"
            checked={addressType === "house"}
            onChange={() => {
              setAddressType("house");
              resetSlot();
            }}
            className="mt-1 h-4 w-4 accent-[var(--brand-orange)]"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold">
              <Truck className="h-4 w-4 text-brand-orange" /> Кур'єрська доставка
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Привеземо на вказану адресу у вибране вікно
            </span>
          </span>
        </label>
      </fieldset>

      {/* Крок 2 — деталі */}
      <div className="mt-6 space-y-4">
        {addressType === "self-pickup" ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label
              htmlFor="pickup-branch"
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Супермаркет «Сільпо»
            </label>
            <select
              id="pickup-branch"
              value={pickupBranchId}
              onChange={(e) => {
                setPickupBranchId(e.target.value);
                resetSlot();
              }}
              disabled={disabled}
              className={fieldClass}
            >
              <option value="">Оберіть супермаркет</option>
              {SILPO_BRANCHES.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {branchLabel(b)}
                </option>
              ))}
            </select>
            {pickupBranchId && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-green">
                <Check className="h-3.5 w-3.5" /> Магазин обрано — оберіть час отримання
              </p>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-3 duration-300">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Місто
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setConfirmed(null);
                    resetSlot();
                  }}
                  disabled={disabled}
                  className={fieldClass}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="street"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Вулиця
                </label>
                <input
                  id="street"
                  value={street}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    setConfirmed(null);
                    resetSlot();
                  }}
                  placeholder="вул. Мазепи"
                  disabled={disabled}
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="house"
                  className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Будинок
                </label>
                <input
                  id="house"
                  value={houseNumber}
                  onChange={(e) => {
                    setHouseNumber(e.target.value);
                    setConfirmed(null);
                    resetSlot();
                  }}
                  placeholder="168А"
                  disabled={disabled}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void confirmAddress()}
                disabled={disabled || isValidating}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold btn-hero disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isValidating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {isValidating ? "Перевіряємо адресу..." : "Підтвердити адресу"}
              </button>

              {confirmed && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-green">
                  <Check className="h-4 w-4" /> Адреса в зоні доставки · {confirmed.latitude},{" "}
                  {confirmed.longitude}
                </span>
              )}
            </div>

            {addressError && <p className="text-xs text-destructive">{addressError}</p>}
          </div>
        )}

        {/* Крок 3 — таймслот */}
        <div className={slotEnabled ? "" : "opacity-50"}>
          <label
            htmlFor="timeslot"
            className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {addressType === "self-pickup" ? "Час отримання" : "Вікно доставки"}
            </span>
          </label>
          <select
            id="timeslot"
            value={slotStart}
            onChange={(e) => setSlotStart(e.target.value)}
            disabled={disabled || !slotEnabled}
            className={fieldClass}
          >
            <option value="">
              {slotEnabled
                ? "Оберіть інтервал"
                : addressType === "self-pickup"
                  ? "Спочатку оберіть супермаркет"
                  : "Спочатку підтвердіть адресу"}
            </option>
            {slots.map((s) => (
              <option key={s.start} value={s.start}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !ready}
          className="w-full rounded-xl px-5 py-4 text-sm font-semibold btn-hero disabled:cursor-not-allowed disabled:opacity-60"
        >
          Підтвердити отримання
        </button>

        {payload && (
          <details className="animate-in fade-in rounded-2xl border border-border bg-muted/50 p-4 text-xs duration-300">
            <summary className="cursor-pointer font-semibold text-muted-foreground">
              Дані для передачі (MCP «Сільпо»)
            </summary>
            <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
