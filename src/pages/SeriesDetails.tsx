import { useEffect, useState } from "react";
import { useParams } from "react-router";
import WebApp from "@twa-dev/sdk";
import type { SeriesDto, SeasonDto, EpisodeDto } from "../types";
import { Play, ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";

export function SeriesDetails() {
  const { id } = useParams();
  const [series, setSeries] = useState<SeriesDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await fetch(`/api/series/${id}`, {
          headers: { "x-telegram-init-data": WebApp.initData }
        });
        const json = await res.json();
        setSeries(json);
        if (json?.seasons?.length > 0) {
          setSelectedSeason(json.seasons[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [id]);

  const handleWatchEpisode = async (episodeId: number, langId: number) => {
      // Find the specific episode language fileId
      const season = series?.seasons.find(s => s.episodes.some(e => e.id === episodeId));
      if (!season) return;
      const episode = season.episodes.find(e => e.id === episodeId);
      if (!episode) return;
      const lang = episode.languages.find(l => l.id === langId);
      if (!lang) return;

      try {
        WebApp.HapticFeedback.impactOccurred("medium");
        const res = await fetch("/api/watch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-init-data": WebApp.initData
          },
          body: JSON.stringify({
            telegramId: WebApp.initDataUnsafe?.user?.id,
            fileId: lang.fileId,
            type: "episode",
            id: episode.id
          })
        });
  
        const data = await res.json();
        if (data.success) {
          WebApp.showAlert("✅ Qism Telegram botingizga yuborildi!");
        } else {
          WebApp.showAlert("❌ Xatolik yuz berdi. " + (data.error || ""));
        }
      } catch (e) {
        WebApp.showAlert("❌ Tarmoq xatosi.");
      }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Previews handling
  const currentSeries = series || {
      id: Number(id),
      title: "Preview Series",
      description: "Fallback text when Database not available.",
      poster: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=800&q=80",
      seasons: [
          { id: 1, seasonNum: 1, episodes: [
              { id: 1, episodeNum: 1, languages: [{ id: 1, language: "O'zbek", fileId: "123" }] },
              { id: 2, episodeNum: 2, languages: [{ id: 1, language: "O'zbek", fileId: "456" }] }
          ] },
          { id: 2, seasonNum: 2, episodes: [
              { id: 3, episodeNum: 1, languages: [{ id: 1, language: "O'zbek", fileId: "789" }] }
          ] }
      ]
  };

  if (!selectedSeason && currentSeries.seasons.length > 0) {
      setTimeout(() => setSelectedSeason(currentSeries.seasons[0].id), 0);
  }

  const activeSeasonData = currentSeries.seasons.find((s: SeasonDto) => s.id === selectedSeason);

  return (
    <div className="flex flex-col pb-24">
      {/* Hero */}
      <div className="relative w-full aspect-video bg-zinc-900">
        <img 
          src={currentSeries.poster} 
          className="w-full h-full object-cover brightness-50" 
          alt={currentSeries.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-3xl font-bold text-white">{currentSeries.title}</h1>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">
         {/* Desc */}
         <p className="text-zinc-400 text-sm">{currentSeries.description}</p>

         {/* Seasons dropdown simulation using flex wraps */}
         <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                 <h3 className="text-lg font-medium text-white">Fasllar</h3>
             </div>
             
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {currentSeries.seasons.map((s: SeasonDto) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeason(s.id)}
                      className={cn(
                          "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                          selectedSeason === s.id ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"
                      )}
                    >
                        {s.seasonNum}-Fasl
                    </button>
                 ))}
             </div>
         </div>

         {/* Episodes List */}
         <div className="flex flex-col gap-4">
             {activeSeasonData?.episodes.map((ep: EpisodeDto) => (
                 <div key={ep.id} className="p-4 bg-zinc-900 rounded-lg flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                         <span className="font-semibold text-lg text-white">{ep.episodeNum}-Qism</span>
                     </div>
                     <div className="flex gap-2 mt-1">
                         {ep.languages.map((l) => (
                             <button
                               key={l.id}
                               onClick={() => handleWatchEpisode(ep.id, l.id)}
                               className="flex-1 flex gap-2 items-center justify-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md text-sm font-medium transition-colors"
                             >
                                 <Play fill="currentColor" className="w-4 h-4" />
                                 {l.language}
                             </button>
                         ))}
                     </div>
                 </div>
             ))}
         </div>

      </div>
    </div>
  );
}
