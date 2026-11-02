import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "SagDoch – Wahrheit oder Pflicht für die Runde" },
  description:
    "Wahrheit oder Pflicht im Browser. Kostenlos, ohne Anmeldung, mit mehreren Packs. Läuft auf dem Handy und lässt sich als App installieren.",
};

export default function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Overscroll und Safe-Areas zeigen sonst den hellen Standard-Hintergrund der App. */}
      <style>{`html,body{background:#0F0F1B}`}</style>
      {children}
    </>
  );
}
