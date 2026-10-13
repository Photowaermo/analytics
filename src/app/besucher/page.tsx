"use client";

/**
 * Besucher — wie viele Menschen die Website besuchen, wo sie landen und woher
 * sie kommen.
 *
 * Liegt bewusst außerhalb von [mode]/: Website-Besuche hängen nicht am
 * Analysemodus. Die Kopfzeile zeigt hier deshalb nur den Zeitraum.
 */

import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDateRange } from "@/lib/date-context";
import { useTraffic } from "@/lib/queries";
import type { TrafficDay, TrafficForm, TrafficResponse } from "@/lib/api";
import { KpiCard, KpiCardSkeleton } from "@/components/ui/kpi-card";
import { TrendChartSkeleton } from "@/components/charts/trend-chart";
import { ErrorCard } from "@/components/ui/error-card";
import { cn, formatNumber } from "@/lib/utils";

const KARTE = "rounded-xl border border-gray-200/50 bg-white/70 p-6 backdrop-blur-sm shadow-sm";

// Die Markenfarbe #A1BF4F hat auf Weiß nur 2:1 Kontrast — als Linie verschwimmt
// sie. Sie bleibt als zarte Fläche, die Linie trägt das dunklere Grün (knapp 4:1).
const LINIE = "#6F8A1F";
const FLAECHE = "#A1BF4F";

/** "24. Sep" — der Punkt, den date-fns an abgekürzte Monate hängt, stört in Achse und Tooltip. */
function tagLabel(datum: string): string {
  return format(parseISO(datum), "d. MMM", { locale: de }).replace(/\.$/, "");
}

/** Ganze Prozent lesen sich ruhiger; ein kleiner Anteil soll trotzdem nicht als "0 %" erscheinen. */
function anteil(pct: number): string {
  return pct < 1 ? "< 1 %" : `${Math.round(pct)} %`;
}

/**
 * Uhrzeit des neuesten Datensatzes. Stammt er nicht von heute, steht das Datum
 * davor — sonst versteckte eine plausible Uhrzeit, dass die Lieferung hängt.
 */
function stand(asOf: string): string {
  const zeitpunkt = new Date(asOf);
  const berlin = { timeZone: "Europe/Berlin" } as const;
  const uhrzeit = zeitpunkt.toLocaleTimeString("de-DE", { ...berlin, hour: "2-digit", minute: "2-digit" });
  const tag = (d: Date) => d.toLocaleDateString("de-DE", { ...berlin, day: "2-digit", month: "2-digit" });
  return tag(zeitpunkt) === tag(new Date()) ? uhrzeit : `${tag(zeitpunkt)} ${uhrzeit}`;
}

/** Wie KpiCard, aber mit ▲/▼ — deren trend-Anzeige kennt nur "+12%". */
function BesucherKachel({ besucher, vorher }: { besucher: number; vorher: number }) {
  // Ohne Besucher im Vorzeitraum gibt es keine Basis für eine Veränderung.
  const prozent = vorher > 0 ? Math.round(((besucher - vorher) / vorher) * 100) : null;

  return (
    <div className={KARTE}>
      <p className="text-sm font-medium text-gray-500">Besucher</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(besucher)}</p>
      {prozent !== null && (
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            prozent > 0 ? "text-green-600" : prozent < 0 ? "text-red-600" : "text-gray-500"
          )}
        >
          {prozent > 0 ? "▲ " : prozent < 0 ? "▼ " : ""}
          {formatNumber(Math.abs(prozent))} %
        </p>
      )}
    </div>
  );
}

function TagesTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrafficDay }> }) {
  if (!active || !payload?.length) return null;
  const tag = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-lg">
      {tagLabel(tag.date)} · {formatNumber(tag.visitors)} Besucher
    </div>
  );
}

function KeineDaten() {
  return <p className="py-2 text-sm text-gray-500">Keine Daten im Zeitraum</p>;
}

function BesucherProTag({ daily }: { daily: TrafficDay[] }) {
  // Aus einem einzelnen Tag (Heute, Gestern) lässt sich keine Linie ziehen —
  // ohne Punkt bliebe das Diagramm leer.
  const einzelnerTag = daily.length === 1;
  // Eine Nulllinie über einer erfundenen Skala sähe nach Daten aus — ohne
  // Besuche sagt das Diagramm dasselbe wie die Listen darunter.
  const leer = daily.every((tag) => tag.visitors === 0);

  return (
    <div className={KARTE}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Besucher pro Tag</h3>
      {leer ? (
        <KeineDaten />
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={tagLabel}
                interval="preserveStartEnd"
                minTickGap={24}
                tick={{ fontSize: 12 }}
                tickLine={false}
                stroke="#9ca3af"
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatNumber}
                width={40}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                stroke="#9ca3af"
              />
              <Tooltip content={<TagesTooltip />} cursor={{ stroke: "#d1d5db" }} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke={LINIE}
                strokeWidth={2}
                fill={FLAECHE}
                fillOpacity={0.15}
                dot={einzelnerTag ? { r: 4, fill: LINIE, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: LINIE, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Liste({ titel, zeilen }: { titel: string; zeilen: { key: string; name: string; wert: string }[] }) {
  return (
    <div className={KARTE}>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">{titel}</h3>
      {zeilen.length === 0 ? (
        <KeineDaten />
      ) : (
        <ul className="divide-y divide-gray-100">
          {zeilen.map((zeile) => (
            <li key={zeile.key} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="min-w-0 truncate text-gray-700" title={zeile.name}>
                {zeile.name}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-gray-900">{zeile.wert}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListenSkelett() {
  return (
    <div className={cn(KARTE, "animate-pulse")}>
      <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

// Jede Zeile ist ein eigenes Raster; feste Breiten der Zahlenspalten halten sie
// trotzdem bündig. Auf 400 px bleiben 320 px Inhalt — zu wenig für vier Spalten,
// dort rutscht der Abbruchpunkt deshalb unter die Zahlen.
const FORMULAR_RASTER =
  "grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-baseline gap-x-4 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_minmax(0,1fr)] sm:gap-x-6";

function Angebotsformular({ forms }: { forms: TrafficForm[] }) {
  const ohneTracking = forms.reduce((summe, f) => summe + f.untracked, 0);
  return (
    <div className={KARTE}>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Angebotsformular</h3>
      <div role="table" aria-label="Angebotsformular" className="divide-y divide-gray-100 text-sm">
        <div role="row" className={cn(FORMULAR_RASTER, "pb-2 text-xs font-medium text-gray-500")}>
          {/* Die Produktspalte braucht ihren Platz im Raster, zeigt aber keine Überschrift. */}
          <span role="columnheader">
            <span className="sr-only">Produkt</span>
          </span>
          <span role="columnheader" className="text-right">
            Begonnen
          </span>
          <span role="columnheader" className="text-right">
            Abgeschickt
          </span>
          <span role="columnheader" className="sr-only sm:not-sr-only">
            Abbrüche bei
          </span>
        </div>
        {forms.map((formular) => {
          const abbruch =
            formular.dropoffs.length > 0
              ? formular.dropoffs.map((d) => `${d.step} (${formatNumber(d.count)})`).join(", ")
              : null;
          return (
            <div key={formular.product} role="row" className={cn(FORMULAR_RASTER, "py-2")}>
              <span role="rowheader" className="min-w-0 truncate text-gray-700">
                {formular.product}
              </span>
              <span role="cell" className="text-right font-medium tabular-nums text-gray-900">
                {formatNumber(formular.started)}
              </span>
              <span role="cell" className="text-right font-medium tabular-nums text-gray-900">
                {formatNumber(formular.submitted)}
              </span>
              {abbruch === null ? (
                // Unter sm stünde ein einsamer Strich in einer eigenen Zeile.
                <span role="cell" className="hidden text-gray-400 sm:block">
                  –
                </span>
              ) : (
                <span
                  role="cell"
                  className="col-span-3 mt-0.5 min-w-0 text-xs text-gray-500 sm:col-span-1 sm:mt-0 sm:text-sm sm:text-gray-700"
                >
                  <span aria-hidden="true" className="sm:hidden">
                    Abbrüche bei{" "}
                  </span>
                  {abbruch}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {ohneTracking > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          Darin {formatNumber(ohneTracking)} {ohneTracking === 1 ? "Anfrage" : "Anfragen"} von Geräten ohne Tracking
          (z. B. Werbeblocker).
        </p>
      )}
    </div>
  );
}

function Inhalt({ data }: { data: TrafficResponse }) {
  const pro100 =
    data.leads_per_100_visitors === null ? "–" : data.leads_per_100_visitors.toFixed(1).replace(".", ",");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BesucherKachel besucher={data.visitors} vorher={data.visitors_previous} />
        <KpiCard title="Angebotsanfragen" value={formatNumber(data.leads)} />
        <KpiCard title="Anfragen pro 100 Besucher" value={pro100} />
      </div>

      <BesucherProTag daily={data.daily} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Liste
          titel="Wo sie landen"
          zeilen={data.landing_pages.map((p) => ({ key: p.path, name: p.name, wert: formatNumber(p.visitors) }))}
        />
        <Liste
          titel="Woher sie kommen"
          zeilen={data.sources.map((q) => ({ key: q.name, name: q.name, wert: anteil(q.share_pct) }))}
        />
        <Liste
          titel="Blogartikel"
          zeilen={data.blog_articles.map((a) => ({ key: a.path, name: a.name, wert: formatNumber(a.visitors) }))}
        />
      </div>

      <Angebotsformular forms={data.forms} />

      <p className="text-xs text-gray-500">
        Ohne Bots{data.as_of ? ` · Stand ${stand(data.as_of)}` : ""}
      </p>
    </>
  );
}

export default function BesucherPage() {
  const { dateRange } = useDateRange();
  const { data, isError, refetch } = useTraffic(dateRange.startDate, dateRange.endDate);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Besucher</h1>
        <ErrorCard message="Besucherdaten konnten nicht geladen werden" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Besucher</h1>
      {data ? (
        <Inhalt data={data} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <TrendChartSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ListenSkelett />
            <ListenSkelett />
            <ListenSkelett />
          </div>
          <ListenSkelett />
        </>
      )}
    </div>
  );
}
