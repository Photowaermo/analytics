/**
 * Abmelden: loescht das Session-Cookie serverseitig und geht zur Anmeldung.
 *
 * Bewusst `window.location` statt Router-Navigation — so wird der komplette
 * React-Baum verworfen und es bleiben keine zwischengespeicherten Daten des
 * abgemeldeten Zugangs im Speicher zurueck.
 */
export async function abmelden(): Promise<void> {
  try {
    await fetch("/api/auth", { method: "DELETE" });
  } finally {
    window.location.href = "/auth";
  }
}
