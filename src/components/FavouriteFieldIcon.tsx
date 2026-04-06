import { Bookmark } from "lucide-react";

/** Medical/clinical “saved default” marker — replaces heart for field bookmarks. */
export function FavouriteFieldIcon({
  active,
  className = "h-5 w-5",
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <Bookmark
      className={`${className} shrink-0 ${
        active
          ? "text-sky-600 fill-sky-600"
          : "text-slate-400 hover:text-sky-600 fill-transparent"
      }`}
      aria-hidden
    />
  );
}
