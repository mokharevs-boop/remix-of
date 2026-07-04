import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";
import { Mic, MicOff, X, Loader2 } from "lucide-react";

const AGENT_ID = "agent_0201kwp228prew8anxbd7dtf94gc";

export function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onError: (e) => {
      console.error("ElevenLabs error", e);
      setError("Не вдалося зʼєднатися з асистентом. Спробуйте ще раз.");
    },
  });

  const status = conversation.status;
  const isActive = status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const start = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (e) {
      console.error(e);
      setError(
        "Потрібен доступ до мікрофона. Перевірте налаштування браузера.",
      );
    } finally {
      setConnecting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 rounded-2xl border border-border bg-card p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display font-bold">Голосовий помічник</div>
              <div className="text-xs text-muted-foreground">
                Наш Край · {isActive ? (isSpeaking ? "говорить…" : "слухає…") : "офлайн"}
              </div>
            </div>
            <button
              onClick={() => {
                if (isActive) stop();
                setOpen(false);
              }}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Закрити"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
            {isActive ? (
              <>
                🎙️ Говоріть у мікрофон. Запитайте про меню, страви або доставку —
                асистент відповість голосом.
              </>
            ) : (
              <>
                👋 Привіт! Я допоможу зі стравами, меню та доставкою Наш Край.
                Натисніть кнопку нижче, щоб почати розмову.
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {!isActive ? (
            <button
              onClick={start}
              disabled={connecting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold btn-brand disabled:opacity-60"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Зʼєднання…
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Почати розмову
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stop}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-destructive py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <MicOff className="h-4 w-4" /> Завершити
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full text-white btn-hero"
        aria-label="Голосовий асистент"
      >
        {isActive && (
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-orange/50" />
        )}
        {!isActive && !open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-orange/40" />
        )}
        <Mic className="relative h-6 w-6" />
      </button>
    </div>
  );
}
