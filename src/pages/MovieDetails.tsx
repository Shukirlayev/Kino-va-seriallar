import { useEffect, useState } from "react";
import { useParams } from "react-router";
import WebApp from "@twa-dev/sdk";
import type { MovieDto } from "../types";
import { Play } from "lucide-react";

export function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState<MovieDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`/api/movies/${id}`, {
          headers: { "x-telegram-init-data": WebApp.initData }
        });
        const json = await res.json();
        setMovie(json);
        if (json?.languages?.length) {
          setSelectedLanguage(json.languages[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  const handleWatch = async () => {
    if (!movie || !selectedLanguage) return;
    const lang = movie.languages.find(l => l.id === selectedLanguage);
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
          type: "movie",
          id: movie.id
        })
      });

      const data = await res.json();
      if (data.success) {
        WebApp.showAlert("✅ Film Telegram botingizga yuborildi!"); // "Film sent to Telegram bot"
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

  // AI Studio Preview default fallback mapping
  const currentMovie = movie || {
    id: Number(id),
    title: "No Title - Preview",
    description: "Database is not configured. This is a preview placeholder. Please provide DATABASE_URL to fully test.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
    languages: [{ id: 1, language: "O'zbek", fileId: "mockfileid" }, { id: 2, language: "Русский", fileId: "mockfileid2" }]
  };
  
  if (!selectedLanguage && currentMovie.languages.length) {
      setSelectedLanguage(currentMovie.languages[0].id);
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Hero Banner */}
      <div className="relative w-full aspect-square md:aspect-video max-h-[60vh] bg-zinc-900 border-b border-zinc-800">
        <img 
          src={currentMovie.poster} 
          className="w-full h-full object-cover brightness-[0.6]" 
          alt={currentMovie.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{currentMovie.title}</h1>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">
        
        {/* Languages Selection */}
        <div className="flex flex-col gap-2">
           <label className="text-sm font-medium text-zinc-400">Tilni tanlang:</label>
           <div className="flex flex-wrap gap-2">
             {currentMovie.languages?.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLanguage(l.id)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors border ${
                    selectedLanguage === l.id 
                    ? "bg-white text-black border-white" 
                    : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  {l.language === "O'zbek" ? "🇺🇿 O'zbek" : l.language === "Русский" ? "🇷🇺 Русский" : `🌍 ${l.language}`}
                </button>
             ))}
           </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleWatch}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-md flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Play fill="white" className="w-5 h-5" />
          <span>Telegramda ko'rish</span>
        </button>

        {/* Description */}
        <div className="flex flex-col gap-2">
           <h3 className="text-lg font-bold text-white">Tavsif</h3>
           <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
             {currentMovie.description}
           </p>
        </div>

      </div>
    </div>
  );
}
