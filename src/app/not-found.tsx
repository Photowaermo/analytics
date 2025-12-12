import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <div className="text-center">
        <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Seite nicht gefunden</h2>
        <p className="text-gray-600 mb-6">
          Die gesuchte Seite existiert nicht.
        </p>
        <Button asChild>
          <Link href="/">Zurück zur Übersicht</Link>
        </Button>
      </div>
    </div>
  );
}
