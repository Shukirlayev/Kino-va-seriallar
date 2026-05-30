import { useEffect, useState } from "react";
import { MovieCard } from "../components/MovieCard";
import WebApp from "@twa-dev/sdk";
import type { ContentResponse } from "../types";

export function Home() {
  const [data, setData] = useState<ContentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/content", {
          headers: {
            "x-telegram-init-data": WebApp.initData,
          }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback mock data if DB is empty / AI Studio preview
  const movies = data?.movies?.length ? data.movies : [
    { id: 1, title: "Mock Film 1", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80", description: "", languages: [] },
    { id: 2, title: "Mock Film 2", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80", description: "", languages: [] }
  ];

  const series = data?.series?.length ? data.series : [
    { id: 1, title: "Mock Serial 1", poster: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80", description: "", seasons: [] }
  ];

  return (
    <div className="flex flex-col gap-8 py-6">
      
      {/* Trending Header */}
      <div className="px-6 relative group h-96 w-full mb-6">
         <img 
           src={movies[0]?.poster} 
           className="absolute inset-0 w-full h-full object-cover brightness-50" 
           alt="Hero"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
         <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tighter text-white">{movies[0]?.title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded text-center">YANGI</span>
              <span className="text-sm font-medium text-zinc-300">Film</span>
            </div>
         </div>
      </div>

      <Section title="🔥 Mashhur" items={movies} type="movie" />
      <Section title="🎬 Filmlar" items={movies.slice().reverse()} type="movie" />
      <Section title="📺 Seriallar" items={series} type="series" />
    </div>
  );
}

function Section({ title, items, type }: { title: string; items: any[]; type: "movie" | "series" }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-6 text-xl font-bold text-white tracking-tight">{title}</h2>
      <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
        {items.map((item) => (
          <MovieCard key={item.id} id={item.id} title={item.title} poster={item.poster} type={type} />
        ))}
      </div>
    </div>
  );
}
