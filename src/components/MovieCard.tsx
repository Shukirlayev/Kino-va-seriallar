import { Link } from "react-router";
import { Play } from "lucide-react";

interface MovieCardProps {
  id: number;
  title: string;
  poster: string;
  type: "movie" | "series";
}

export function MovieCard({ id, title, poster, type }: MovieCardProps) {
  return (
    <Link
      to={`/${type}/${id}`}
      className="group relative flex-shrink-0 w-32 md:w-40 snap-start overflow-hidden rounded-md transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <div className="aspect-[2/3] w-full bg-zinc-800 relative">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs text-center p-2">
             No Image
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <Play fill="white" className="w-8 h-8 opacity-80" />
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-200 truncate">{title}</div>
    </Link>
  );
}
