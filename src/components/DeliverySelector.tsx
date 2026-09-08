import { useEffect, useMemo, useState } from "react";
import { MapPin, Store, Truck } from "lucide-react";

export type Branch = {
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

export type DeliverySelection = {
  addressType: "self-pickup" | "house";
  deliveryType: "SelfPickup" | "DeliveryHome";
  branchId: string;
  city: string;
  street: string;
  house?: string;
  timeslot?: { start: string; end: string };
};

type Slot = { start: string; end: string; label: string };

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand-orange disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  disabled?: boolean;
  onChange: (selection: DeliverySelection | null) => void;
};

/** Компактний вибір способу отримання для Hero: таби + магазин/адреса + таймслот. */
export function DeliverySelector({ disabled, onChange }: Props) {
  const [addressType, setAddressType] = useState<"self-pickup" | "house">("self-pickup");
  const [pickupBranchId, setPickupBranchId] = useState(
    SILPO_BRANCHES[0]?.branchId ?? "",
  );
  const [city, setCity] = useState(SILPO_BRANCHES[0]?.city ?? "");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [slotStart, setSlotStart] = useState("");

  // Таймслоти будуємо лише на клієнті після монтування — уникаємо розбіжності SSR/клієнт.
  const [slots, setSlots] = useState<Slot[]>([]);
  useEffect(() => {
    const now = new Date();
    const built: Slot[] = [];
    for (let day = 0; day < 2; day += 1) {
      for (const hour of [10, 12, 14, 16, 18]) {
        const start = new Date(now);
        start.setDate(now.getDate() + day);
        start.setHours(hour, 0, 0, 0);
        if (start.getTime() < now.getTime() + 60 * 60 * 1000) continue;
        const end = new Date(start);
        end.setHours(hour + 2);
        const dayLabel =
          day === 0
            ? "Сьогодні"
            : start.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
        built.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${dayLabel}, ${String(hour).padStart(2, "0")}:00 – ${String(hour + 2).padStart(2, "0")}:00`,
        });
      }
    }
    setSlots(built);
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(SILPO_BRANCHES.map((b) => b.city))),
    [],
  );

  const selectedSlot = slots.find((s) => s.start === slotStart);

  // Повідомляємо батьківський компонент про поточний вибір.
  useEffect(() => {
    if (addressType === "self-pickup") {
      const branch = SILPO_BRANCHES.find((b) => b.branchId === pickupBranchId);
      if (!branch) {
        onChange(null);
        return;
      }
      onChange({
        addressType: "self-pickup",
        deliveryType: "SelfPickup",
        branchId: branch.branchId,
        city: branch.city,
        street: branch.street,
        house: branch.house,
        timeslot: selectedSlot
          ? { start: selectedSlot.start, end: selectedSlot.end }
          : undefined,
      });
      return;
    }
    // Кур'єрська доставка: branchId найближчої філії міста.
    const branch =
      SILPO_BRANCHES.find((b) => b.city === city) ?? SILPO_BRANCHES[0];
    if (!street.trim() || !houseNumber.trim()) {
      onChange({
        addressType: "house",
        deliveryType: "DeliveryHome",
        branchId: branch.branchId,
        city,
        street: street.trim(),
        house: houseNumber.trim(),
        timeslot: undefined,
      });
      return;
    }
    onChange({
      addressType: "house",
      deliveryType: "DeliveryHome",
      branchId: branch.branchId,
      city,
      street: street.trim(),
      house: houseNumber.trim(),
      timeslot: selectedSlot
        ? { start: selectedSlot.start, end: selectedSlot.end }
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressType, pickupBranchId, city, street, houseNumber, slotStart, slots]);

  const tabClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
      active
        ? "border-brand-orange bg-brand-orange/10 text-brand-orange shadow-[var(--shadow-warm)]"
        : "border-border bg-background text-muted-foreground hover:border-brand-orange/50 hover:text-foreground"
    }`;

  return (
    <div className="space-y-3">
      {/* Таби способу отримання */}
      <div
        role="radiogroup"
        aria-label="Спосіб отримання"
        className="flex gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={addressType === "self-pickup"}
          onClick={() => {
            setAddressType("self-pickup");
            setSlotStart("");
          }}
          disabled={disabled}
          className={tabClass(addressType === "self-pickup")}
        >
          <Store className="h-4 w-4" />
          <span className="hidden sm:inline">Самовивіз із супермаркету</span>
          <span className="sm:hidden">Самовивіз</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={addressType === "house"}
          onClick={() => {
            setAddressType("house");
            setSlotStart("");
          }}
          disabled={disabled}
          className={tabClass(addressType === "house")}
        >
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Кур'єрська доставка</span>
          <span className="sm:hidden">Доставка</span>
        </button>
      </div>

      {addressType === "self-pickup" ? (
        <div className="animate-in fade-in slide-in-from-top-1 grid gap-3 duration-200 sm:grid-cols-2">
          <select
            aria-label="Супермаркет «Сільпо»"
            value={pickupBranchId}
            onChange={(e) => setPickupBranchId(e.target.value)}
            disabled={disabled}
            className={fieldClass}
          >
            {SILPO_BRANCHES.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.city}, {b.street}, {b.house}
              </option>
            ))}
          </select>
          <select
            aria-label="Час отримання"
            value={slotStart}
            onChange={(e) => setSlotStart(e.target.value)}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Бажаний час отримання</option>
            {slots.map((s) => (
              <option key={s.start} value={s.start}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-3 duration-200">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              aria-label="Місто"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setSlotStart("");
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
            <input
              aria-label="Вулиця"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Вулиця"
              disabled={disabled}
              className={fieldClass}
            />
            <input
              aria-label="Будинок"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="Будинок"
              disabled={disabled}
              className={fieldClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Вікно доставки"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              disabled={disabled}
              className={fieldClass}
            >
              <option value="">Вікно доставки</option>
              {slots.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-brand-green" />
              Доставку виконає найближча філія «Сільпо» у вашому місті
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
