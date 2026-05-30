import { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { Search as SearchIcon } from "lucide-react";
import { MovieCard } from "../components/MovieCard";

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{movies: any[], series: any[]}>({ movies: [], series: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query.trim()) {
        setResults({ movies: [], series: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { "x-telegram-init-data": WebApp.initData }
        });
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 gap-6">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filmlar va seriallarni qidiring..."
          className="w-full bg-zinc-900 text-white placeholder-zinc-500 py-4 pl-12 pr-4 rounded-xl outline-none focus:ring-2 ring-zinc-700 transition-all font-medium"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
           <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin" />
           </div>
        ) : query.trim() !== "" && !results.movies.length && !results.series.length ? (
           <div className="flex justify-center text-zinc-500 py-10">
             Hech narsa topilmadi
           </div>
        ) : (
           <div className="flex flex-col gap-8">
              {results.movies.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-white">Filmlar</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {results.movies.map(m => (
                       <MovieCard key={`m-${m.id}`} id={m.id} title={m.title} poster={m.poster} type="movie" />
                    ))}
                  </div>
                </div>
              )}
              {results.series.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-white">Seriallar</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {results.series.map(s => (
                       <MovieCard key={`s-${s.id}`} id={s.id} title={s.title} poster={s.poster} type="series" />
                    ))}
                  </div>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
