import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mic,
  ChefHat,
  Sparkles,
  Timer,
  Leaf,
  Phone,
  MapPin,
  Mail,
  Star,
  Menu as MenuIcon,
  X,
  LoaderCircle,
} from "lucide-react";
import { Cart } from "@/components/Cart";
import { mergeCartItems, parseCartItems, type CartItem } from "@/components/cart-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Опліс — Кулінарія та святкові страви на замовлення" },
      {
        name: "description",
        content:
          "Замовляйте нарізки, гарячі страви, фуршетні закуски та святкові торти від мережі супермаркетів Опліс. Свіжо, швидко, від шеф-кухарів.",
      },
      { property: "og:title", content: "Опліс — Святкова кулінарія на замовлення" },
      {
        property: "og:description",
        content: "Свіжі страви від шеф-кухарів Опліс для вашого свята.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const dishes = [
  {
    title: "М'ясні та сирні нарізки",
    desc: "Асорті преміум-ковбас, хамону, сирів з горіхами та медом.",
    price: "від 320 ₴",
    emoji: "🧀",
  },
  {
    title: "Гарячі страви",
    desc: "Запечена качка, соковита буженина, картопля по-домашньому.",
    price: "від 450 ₴",
    emoji: "🍗",
  },
  {
    title: "Фуршетні закуски",
    desc: "Канапе, тарталетки, міні-роли — стильно та зручно для гостей.",
    price: "від 280 ₴",
    emoji: "🥂",
  },
  {
    title: "Торти на замовлення",
    desc: "Авторські десерти від кондитерів за вашим ескізом.",
    price: "від 520 ₴/кг",
    emoji: "🎂",
  },
];

const features = [
  {
    icon: Leaf,
    title: "Свіжість щодня",
    desc: "Готуємо з продуктів, які щоранку постачаються у наші супермаркети.",
  },
  {
    icon: ChefHat,
    title: "Шеф-кухарі",
    desc: "Меню розроблене професіоналами з 15+ роками досвіду в ресторанній справі.",
  },
  {
    icon: Timer,
    title: "Швидко до столу",
    desc: "Прийом замовлень до 24 год до події. Доставка або самовивіз з магазину.",
  },
];

const reviews = [
  {
    name: "Оксана П.",
    city: "Львів",
    text: "Замовляли фуршет на 40 гостей — усе було свіже, красиво оформлене та вчасно доставлене. Дякую!",
  },
  {
    name: "Андрій М.",
    city: "Івано-Франківськ",
    text: "Торт на день народження доньки перевершив очікування. Смак — як у дитинстві, а вигляд — вау.",
  },
  {
    name: "Марія та Ігор",
    city: "Тернопіль",
    text: "Святкували річницю вдома. Гарячі страви ще теплі приїхали, гості просили рецепти :)",
  },
];

function Landing() {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventDescription, setEventDescription] = useState("");
  const [menuResponse, setMenuResponse] = useState("");
  const [menuError, setMenuError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const updateQuantity = (sku: string, quantity: number) => {
    setCartItems((prev) =>
      quantity < 1
        ? prev.filter((item) => item.sku !== sku)
        : prev.map((item) => (item.sku === sku ? { ...item, quantity } : item)),
    );
  };

  const removeItem = (sku: string) => {
    setCartItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  const generateMenu = async () => {
    const message = eventDescription.trim();
    if (!message || isGenerating) return;

    setIsGenerating(true);
    setMenuResponse("");
    setMenuError("");

    try {
      const response = await fetch("https://n8n58127.hostkey.in/webhook-test/b8f22d11-2c8e-4df3-92c9-8227f2f515e4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const result: unknown = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(`Сервер повернув помилку ${response.status}`);
      }

      const newItems = parseCartItems(result);
      if (newItems.length > 0) {
        setCartItems((prev) => mergeCartItems(prev, newItems));
      }

      if (typeof result === "string") {
        setMenuResponse(result);
      } else if (result && typeof result === "object") {
        const payload = Array.isArray(result)
          ? ({} as Record<string, unknown>)
          : (result as Record<string, unknown>);
        const answer = payload.answer ?? payload.message ?? payload.response ?? payload.output;
        setMenuResponse(
          typeof answer === "string"
            ? answer
            : newItems.length > 0
              ? `Готово! Додано ${newItems.length} позицій до кошика.`
              : JSON.stringify(result, null, 2),
        );
      } else {
        setMenuResponse("Меню згенеровано, але сервер не повернув текстової відповіді.");
      }
    } catch (error) {
      setMenuError(
        error instanceof Error
          ? `Не вдалося згенерувати меню. ${error.message}`
          : "Не вдалося згенерувати меню. Спробуйте ще раз.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white shadow-[var(--shadow-soft)]">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-brand-green">Опліс</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Кулінарія
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#about" className="text-sm font-medium hover:text-brand-green">Про послугу</a>
            <a href="#menu" className="text-sm font-medium hover:text-brand-green">Меню</a>
            <a href="#reviews" className="text-sm font-medium hover:text-brand-green">Відгуки</a>
            <a href="#contacts" className="text-sm font-medium hover:text-brand-green">Контакти</a>
          </nav>

          <a
            href="#menu"
            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold btn-brand md:inline-flex"
          >
            Скласти меню
          </a>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Меню"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border md:hidden">
            <div className="flex flex-col gap-1 px-4 py-3">
              {[
                ["Про послугу", "#about"],
                ["Меню", "#menu"],
                ["Відгуки", "#reviews"],
                ["Контакти", "#contacts"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden surface-hero">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-green/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-green backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Святкове меню від Опліс
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Святкуйте без турбот —{" "}
              <span className="bg-gradient-to-r from-brand-green to-brand-orange bg-clip-text text-transparent">
                кулінарія Опліс
              </span>{" "}
              для вашого свята
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Замовляйте нарізки, гарячі страви, фуршетні закуски та авторські торти. Ми
              приготуємо, оформимо та привеземо — вам залишиться лише насолоджуватися.
            </p>
            <div className="mt-8 max-w-xl">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:flex-row">
                <label htmlFor="event-description" className="sr-only">
                  Опишіть вашу подію
                </label>
                <input
                  id="event-description"
                  value={eventDescription}
                  onChange={(event) => setEventDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void generateMenu();
                  }}
                  disabled={isGenerating}
                  placeholder="Опишіть вашу подію, і ШІ складе меню..."
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-orange disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void generateMenu()}
                  disabled={isGenerating || !eventDescription.trim()}
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold btn-hero disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {isGenerating ? "ШІ аналізує..." : "Згенерувати меню"}
                </button>
              </div>

              {(menuResponse || menuError) && (
                <div
                  className={`mt-4 whitespace-pre-wrap rounded-2xl border p-5 text-sm shadow-[var(--shadow-soft)] ${
                    menuError
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-brand-green/30 bg-card text-foreground"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {menuError || menuResponse}
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm">
              <div>
                <div className="text-2xl font-bold text-brand-green">200+</div>
                <div className="text-muted-foreground">магазинів мережі</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-orange">24 год</div>
                <div className="text-muted-foreground">до вашого свята</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-green">100%</div>
                <div className="text-muted-foreground">свіжі продукти</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto grid max-w-md grid-cols-2 gap-4">
              <div className="col-span-2 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="mb-2 text-5xl">🍽️</div>
                <div className="font-display text-lg font-bold">Святковий стіл</div>
                <div className="text-sm text-muted-foreground">
                  Готове рішення на 8–12 гостей за 2 950 ₴
                </div>
              </div>
              <div className="rounded-3xl bg-brand-green p-6 text-white shadow-[var(--shadow-soft)]">
                <div className="mb-2 text-4xl">🥗</div>
                <div className="font-display font-bold">Свіжі салати</div>
                <div className="text-sm opacity-90">щоденно</div>
              </div>
              <div className="rounded-3xl bg-brand-orange p-6 text-white shadow-[var(--shadow-warm)]">
                <div className="mb-2 text-4xl">🎂</div>
                <div className="font-display font-bold">Торти</div>
                <div className="text-sm opacity-90">від кондитерів</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cart */}
      <section id="cart" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Кошик
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Ваше замовлення</h2>
          <p className="mt-3 text-muted-foreground">
            Товари, підібрані ШІ, з'являються тут автоматично. Змінюйте кількість — суми та
            вага перераховуються миттєво.
          </p>
        </div>

        <Cart
          items={cartItems}
          onQuantityChange={updateQuantity}
          onRemove={removeItem}
          onCheckout={() => {
            document.getElementById("contacts")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Про послугу
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Чому обирають кулінарію Опліс
          </h2>
          <p className="mt-4 text-muted-foreground">
            Ми поєднуємо якість супермаркету з майстерністю ресторану. Кожна страва — це
            перевірені інгредієнти, авторські рецепти та турбота до дрібниць.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-card p-8 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">
              Наше меню
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Страви для будь-якого свята
            </h2>
            <p className="mt-4 text-muted-foreground">
              Оберіть категорію та складіть ідеальне меню — або скористайтесь готовими наборами.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dishes.map((d) => (
              <div
                key={d.title}
                className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-green/10 to-brand-orange/10 text-6xl transition group-hover:scale-105">
                  {d.emoji}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold">{d.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.desc}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-brand-orange">
                      {d.price}
                    </span>
                    <button className="rounded-full bg-brand-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-green-dark">
                      Замовити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
            Відгуки
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Що кажуть наші клієнти
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
            >
              <div className="flex gap-1 text-brand-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-foreground">«{r.text}»</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green to-brand-green-dark" />
        <div className="relative mx-auto max-w-7xl px-4 text-white sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">
                Контакти
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Зробіть замовлення просто зараз
              </h2>
              <p className="mt-4 max-w-lg text-white/80">
                Зателефонуйте, напишіть нам або скористайтесь голосовим асистентом у правому
                нижньому куті сайту.
              </p>

              <div className="mt-10 space-y-5">
                <a href="tel:+380800300000" className="flex items-center gap-4 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 group-hover:bg-brand-orange">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Телефон</div>
                    <div className="text-lg font-semibold">0 800 30 00 00</div>
                  </div>
                </a>
                <a href="mailto:catering@nashkraj.ua" className="flex items-center gap-4 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 group-hover:bg-brand-orange">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Email</div>
                    <div className="text-lg font-semibold">catering@nashkraj.ua</div>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">Адреса</div>
                    <div className="text-lg font-semibold">Мережа супермаркетів по Україні</div>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Дякуємо! Ми зв'яжемось з вами найближчим часом.");
              }}
              className="rounded-3xl bg-white p-8 text-foreground shadow-2xl"
            >
              <h3 className="text-xl font-bold">Залишити заявку</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Наш менеджер зателефонує впродовж 15 хвилин.
              </p>
              <div className="mt-6 space-y-4">
                <input
                  required
                  placeholder="Ваше ім'я"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-green"
                />
                <input
                  required
                  type="tel"
                  placeholder="Телефон"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-green"
                />
                <textarea
                  rows={3}
                  placeholder="Дата свята та кількість гостей"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand-green"
                />
                <button
                  type="submit"
                  className="w-full rounded-full py-4 text-base font-semibold btn-hero"
                >
                  Замовити консультацію
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} Опліс. Кулінарія для свята.</div>
          <div>Made with 💚🧡 in Ukraine</div>
        </div>
      </footer>

      {/* Voice AI Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {voiceOpen && (
          <div className="w-72 rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-bold">Голосовий помічник</div>
                <div className="text-xs text-muted-foreground">Опліс · онлайн</div>
              </div>
              <button
                onClick={() => setVoiceOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Закрити"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
              👋 Привіт! Я допоможу скласти святкове меню. Натисніть кнопку мікрофона і
              скажіть, скільки гостей чекаєте.
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold btn-brand">
              <Mic className="h-4 w-4" /> Говорити
            </button>
          </div>
        )}

        <button
          onClick={() => setVoiceOpen((v) => !v)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full text-white btn-hero"
          aria-label="Голосовий асистент"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-orange/40" />
          <Mic className="relative h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
