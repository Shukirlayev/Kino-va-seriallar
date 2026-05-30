import { useEffect, useState } from "react";
import { MovieCard } from "../components/MovieCard";
import WebApp from "@twa-dev/sdk";

export function Home() {
  const [data, setData] = useState<{movies: any[], series: any[], error?: boolean}>({movies: [], series: []});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch("/api/content", {
          headers: { "x-telegram-init-data": WebApp.initData || "" }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch xatosi", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { movies, series, error } = data;

  if (error) {
     return (
       <div className="p-8 text-center flex flex-col gap-3 font-medium border border-zinc-800 m-4 rounded-xl bg-zinc-900 border-dashed text-zinc-400">
          <span className="text-2xl">🚧</span>
           Baza ulanmagan. Ma'lumot yo'q. Loyihani Deploy qiling va Baza parollarini taqdim eting.
       </div>
     )
  }

  const isEmpty = movies.length === 0 && series.length === 0;

  if (isEmpty) {
      return (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 gap-4 mt-20">
             <div className="text-4xl text-zinc-700">🎬</div>
             <p className="font-medium text-lg text-white">Hozircha bo'sh</p>
             <p className="text-sm">Admin bot orqali hali filmlar ulanmagan. Iltimos Botdagi /admin menusi orqali film qo'shing.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-8 py-6">
      
      {movies.length > 0 && (
         <div className="px-6 relative group h-96 w-full mb-6">
           <img 
             src={movies[0]?.poster} 
             className="absolute inset-0 w-full h-full object-cover brightness-50 rounded-xl" 
             alt="Hero"
           />
           <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
           <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-3">
              <h1 className="text-4xl font-bold tracking-tighter text-white drop-shadow-md">{movies[0]?.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded text-center shadow-lg">YANGI</span>
                <span className="text-sm font-medium text-zinc-300 drop-shadow-md">Eng mashhur</span>
              </div>
           </div>
         </div>
      )}

      <Section title="🔥 Yangi Filmlar" items={movies} type="movie" />
      <Section title="📺 Seriallar" items={series} type="series" />
    </div>
  );
}

function Section({ title, items, type }: { title: string; items: any[]; type: "movie" | "series" }) {
  if (!items || !items.length) return null;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="px-6 text-xl font-bold text-white tracking-tight">{title}</h2>
      <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
        {items.map((item) => (
          <MovieCard key={`${type}-${item.id}`} id={item.id} title={item.title} poster={item.poster} type={type} />
        ))}
      </div>
    </div>
  );
}
