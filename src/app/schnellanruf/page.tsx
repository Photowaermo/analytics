"use client";

/**
 * Schnellanruf — der 30-Minuten-Tab.
 *
 * Eine Person ruft jeden neu eingehenden Lead innerhalb von 30 Minuten an.
 * Die Seite holt alle 10 Sekunden neue Daten, meldet neue Leads mit Ton und
 * Browser-Benachrichtigung und zeigt je Zeile einen laufenden Countdown.
 *
 * Gewertet wird nur Mo-Fr zwischen 9 und 17 Uhr. Leads ausserhalb stehen
 * trotzdem in der Liste (jemand koennte sie freiwillig mitnehmen), zaehlen aber
 * nicht in die Quote — dafuer ist niemand eingeteilt.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpeedDialLeads,
  setSpeedDialState,
  type SpeedDialLead,
  type SpeedDialState,
  type SpeedDialResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { abmelden } from "@/lib/logout";
import { Bell, BellOff, ExternalLink, LogOut, Phone } from "lucide-react";

const POLL_MS = 10_000;

const STATUS_OPTIONEN: { wert: SpeedDialState | ""; label: string }[] = [
  { wert: "", label: "Nicht bearbeitet" },
  { wert: "nicht_erreicht", label: "Nicht erreicht" },
  { wert: "erreicht_keine_zeit", label: "Erreicht, aber keine Zeit gehabt" },
  { wert: "erreicht_formular", label: "Erreicht und Formular ausgefüllt" },
];

/** Zeilenfarbe je Status. Unbearbeitete Zeilen faerbt der Countdown ein. */
const ZEILEN_FARBE: Record<string, string> = {
  nicht_erreicht: "bg-amber-50 hover:bg-amber-100/70",
  erreicht_keine_zeit: "bg-sky-50 hover:bg-sky-100/70",
  erreicht_formular: "bg-emerald-50 hover:bg-emerald-100/70",
};

const SELECT_FARBE: Record<string, string> = {
  "": "bg-white border-gray-300 text-gray-700",
  nicht_erreicht: "bg-amber-100 border-amber-300 text-amber-900",
  erreicht_keine_zeit: "bg-sky-100 border-sky-300 text-sky-900",
  erreicht_formular: "bg-emerald-100 border-emerald-300 text-emerald-900",
};

/** Sekunden seit dem letzten erfolgreichen Datenabruf. */
function sekundenSeit(zeitpunkt: number, jetzt: number): number {
  if (!zeitpunkt) return 0;
  return Math.max(0, Math.floor((jetzt - zeitpunkt) / 1000));
}

function uhrzeit(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Kurzer Signalton ueber die WebAudio-API — kommt ohne Audiodatei aus. */
function signalTon() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    // Ton ist Beiwerk — ein blockierter AudioContext darf nichts kaputtmachen.
  }
}

/** Was der Signal-Schalter tatsaechlich leistet.
 *  "ton"  = Erlaubnis fuer Benachrichtigungen fehlt noch, es piept nur.
 *  "voll" = Ton und Browser-Benachrichtigung. */
type SignalStufe = "aus" | "ton" | "voll";

export default function SchnellanrufPage() {
  const queryClient = useQueryClient();
  const [signal, setSignal] = useState<SignalStufe>("aus");
  const [jetzt, setJetzt] = useState(() => Date.now());
  const bekannteIds = useRef<Set<string> | null>(null);

  // Beim Laden den echten Zustand uebernehmen, statt "an" zu behaupten.
  // Browser verlangen fuer requestPermission() eine Nutzeraktion, deshalb kann
  // hier nicht ungefragt nachgefragt werden — der Schalter zeigt stattdessen
  // ehrlich an, dass bisher nur der Ton funktioniert.
  useEffect(() => {
    if (typeof Notification === "undefined") {
      setSignal("ton");
      return;
    }
    setSignal(Notification.permission === "granted" ? "voll" : "ton");
  }, []);

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useQuery<SpeedDialResponse>({
      queryKey: ["speed-dial"],
      queryFn: getSpeedDialLeads,
      refetchInterval: POLL_MS,
      refetchOnWindowFocus: true,
    });

  // Countdown-Ticker: einmal pro Sekunde neu rendern.
  useEffect(() => {
    const t = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Neue Leads erkennen und melden. Der erste Ladevorgang fuellt nur die
  // Referenzmenge — sonst wuerde beim Oeffnen der Seite alles auf einmal piepen.
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.leads.map((l) => l.id));
    if (bekannteIds.current === null) {
      bekannteIds.current = ids;
      return;
    }
    const neue = data.leads.filter((l) => !bekannteIds.current!.has(l.id));
    bekannteIds.current = ids;
    if (neue.length === 0 || signal === "aus") return;

    signalTon();
    if (signal === "voll" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      const erster = neue[0];
      new Notification(
        neue.length === 1 ? "Neuer Lead" : `${neue.length} neue Leads`,
        {
          body:
            neue.length === 1
              ? `${erster.name} — ${erster.phone ?? "keine Nummer"}`
              : "Jetzt anrufen",
          tag: "schnellanruf",
        }
      );
    }
  }, [data, signal]);

  const mutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: SpeedDialState | null }) =>
      setSpeedDialState(id, state),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["speed-dial"] }),
  });

  /** Ein Klick fuehrt durch: aus -> Ton -> (Erlaubnis holen) -> voll -> aus. */
  const signalUmschalten = async () => {
    if (signal === "aus") {
      setSignal("ton");
      return;
    }
    if (signal === "ton" && typeof Notification !== "undefined") {
      // Der Klick ist die geforderte Nutzeraktion — hier darf gefragt werden.
      const antwort =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      setSignal(antwort === "granted" ? "voll" : "aus");
      return;
    }
    setSignal("aus");
  };


  const stats = data?.stats;
  const sla = data?.sla_minutes ?? 30;

  // Offene Leads zuerst, danach nach Eingang absteigend — was drängt, steht oben.
  const sortiert = useMemo(() => {
    if (!data) return [];
    return [...data.leads].sort((a, b) => {
      if (!a.state && b.state) return -1;
      if (a.state && !b.state) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data]);

  if (isLoading) {
    return <div className="p-8 text-gray-500">Lade Leads…</div>;
  }
  if (isError) {
    return (
      <div className="p-8">
        <p className="text-red-700">Leads konnten nicht geladen werden.</p>
        <button onClick={() => refetch()} className="mt-3 text-sm underline">
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schnellanruf</h1>
          <p className="text-sm text-gray-500">
            Jeden neuen Lead innerhalb von {sla} Minuten anrufen · gewertet{" "}
            {data?.arbeitsfenster.tage} {data?.arbeitsfenster.von}–
            {data?.arbeitsfenster.bis} Uhr
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live-Anzeige statt Aktualisieren-Knopf: die Liste holt sich alle
              10 Sekunden neue Daten, es gibt nichts zu druecken. Ein Klick
              erzwingt trotzdem ein sofortiges Nachladen. */}
          <button
            onClick={() => refetch()}
            title="Aktualisiert sich automatisch — klicken für sofort"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full bg-emerald-400",
                  isFetching && "animate-ping"
                )}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
            <span className="tabular-nums text-gray-400">
              {sekundenSeit(dataUpdatedAt, jetzt)} s
            </span>
          </button>

          <button
            onClick={signalUmschalten}
            title={
              signal === "voll"
                ? "Ton und Benachrichtigung aktiv"
                : signal === "ton"
                  ? "Nur Ton — klicken, um Benachrichtigungen zu erlauben"
                  : "Kein Signal bei neuen Leads"
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
              signal === "voll"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : signal === "ton"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-300 bg-white text-gray-600"
            )}
          >
            {signal === "aus" ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {signal === "voll"
              ? "Signal an"
              : signal === "ton"
                ? "Nur Ton"
                : "Signal aus"}
          </button>

          <button
            onClick={abmelden}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>

      {signal === "ton" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Es piept nur — Browser-Benachrichtigungen sind noch nicht erlaubt.
          Klick auf <span className="font-semibold">Nur Ton</span>, dann fragt
          der Browser nach. Danach siehst du neue Leads auch, wenn der Tab im
          Hintergrund liegt.
        </div>
      )}

      {/* Statistik */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kachel
            label={`In ${sla} Min erledigt`}
            wert={stats.quote === null ? "–" : `${stats.quote}%`}
            hinweis={`${stats.in_time} von ${stats.gewertet}`}
            betont
          />
          <Kachel label="Offen" wert={String(stats.offen)} hinweis="noch nicht bearbeitet" />
          <Kachel label="Erreicht" wert={String(stats.erreicht)} hinweis="Kunde am Telefon" />
          <Kachel label="Formular" wert={String(stats.formular)} hinweis="ausgefüllt" />
          <Kachel
            label="Schnitt"
            wert={stats.schnitt_min === null ? "–" : `${stats.schnitt_min} Min`}
            hinweis="bis zur Bearbeitung"
          />
          <Kachel
            label="Außerhalb"
            wert={String(stats.ausserhalb)}
            hinweis="zählt nicht"
          />
        </div>
      )}

      {/* Liste */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Frist</th>
              <th className="px-4 py-3">Eingang</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Quelle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reonic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortiert.map((lead) => (
              <Zeile
                key={lead.id}
                lead={lead}
                sla={sla}
                jetzt={jetzt}
                onStatus={(state) => mutation.mutate({ id: lead.id, state })}
                speichert={mutation.isPending && mutation.variables?.id === lead.id}
              />
            ))}
            {sortiert.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Noch keine Leads. Sobald einer reinkommt, erscheint er hier
                  automatisch — mit Ton.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kachel({
  label,
  wert,
  hinweis,
  betont,
}: {
  label: string;
  wert: string;
  hinweis: string;
  betont?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        betont ? "border-accent/30 bg-accent/5" : "border-gray-200 bg-white"
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{wert}</div>
      <div className="text-xs text-gray-400">{hinweis}</div>
    </div>
  );
}

function Zeile({
  lead,
  sla,
  jetzt,
  onStatus,
  speichert,
}: {
  lead: SpeedDialLead;
  sla: number;
  jetzt: number;
  onStatus: (state: SpeedDialState | null) => void;
  speichert: boolean;
}) {
  const alter = (jetzt - new Date(lead.created_at).getTime()) / 60_000;
  const restMin = sla - alter;
  const offen = !lead.state;

  // Unbearbeitete Zeilen faerbt die Restzeit: rot ab abgelaufen, gelb ab 10 Min.
  const dringend = offen && restMin <= 0;
  const knapp = offen && restMin > 0 && restMin <= 10;

  const zeilenKlasse = lead.state
    ? ZEILEN_FARBE[lead.state]
    : dringend
      ? "bg-red-50 hover:bg-red-100/70"
      : knapp
        ? "bg-yellow-50 hover:bg-yellow-100/70"
        : "hover:bg-gray-50";

  return (
    <tr className={cn("transition-colors", zeilenKlasse, !lead.gewertet && "opacity-70")}>
      <td className="px-4 py-3 whitespace-nowrap">
        {lead.state ? (
          <span
            className={cn(
              "font-medium",
              lead.in_time ? "text-emerald-700" : "text-gray-500"
            )}
          >
            {lead.reaktion_min !== null ? `${lead.reaktion_min} Min` : "–"}
            {lead.in_time && " ✓"}
          </span>
        ) : (
          <span
            className={cn(
              "font-mono font-semibold",
              dringend ? "text-red-700" : knapp ? "text-yellow-700" : "text-gray-700"
            )}
          >
            {restMin > 0
              ? `${Math.floor(restMin)}:${String(
                  Math.floor((restMin % 1) * 60)
                ).padStart(2, "0")}`
              : "abgelaufen"}
          </span>
        )}
        {!lead.gewertet && (
          <div className="text-[11px] text-gray-400">außerhalb</div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
        {uhrzeit(lead.created_at)}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{lead.name}</div>
        {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center gap-1.5 font-medium text-gray-900 hover:text-accent"
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </a>
        ) : (
          <span className="text-gray-400">–</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
        {lead.source ?? "–"}
        {lead.product && (
          <div className="text-xs text-gray-400">{lead.product}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={lead.state ?? ""}
          disabled={speichert}
          onChange={(e) =>
            onStatus((e.target.value || null) as SpeedDialState | null)
          }
          className={cn(
            "w-full min-w-[210px] rounded-lg border px-2.5 py-1.5 text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50",
            SELECT_FARBE[lead.state ?? ""]
          )}
        >
          {STATUS_OPTIONEN.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {lead.reonic_url ? (
          <a
            href={lead.reonic_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-accent hover:text-accent"
          >
            Öffnen
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="text-xs text-gray-400">noch nicht in Reonic</span>
        )}
      </td>
    </tr>
  );
}
