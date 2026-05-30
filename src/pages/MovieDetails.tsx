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
          headers: { "x-telegram-init-data": WebApp.initData || "" }
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
    const tgId = WebApp.initDataUnsafe?.user?.id;
    if (!tgId) {
       alert("Telegram topilmadi. Iltimos xaqiqiy Telegram ilovasi (Bot) orqali kiring.");
       return;
    }
    
    if (!movie || !selectedLanguage) return;
    const lang = movie.languages.find(l => l.id === selectedLanguage);
    if (!lang) return;

    try {
      if (WebApp.HapticFeedback && WebApp.HapticFeedback.impactOccurred) {
        WebApp.HapticFeedback.impactOccurred("medium");
      }
      
      WebApp.showAlert("⏳ Videoni botga tayyorlanmoqda...");

      const res = await fetch("/api/watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": WebApp.initData || ""
        },
        body: JSON.stringify({
          telegramId: tgId,
          fileId: lang.fileId,
          type: "movie",
          id: movie.id
        })
      });

      const data = await res.json();
      if (data.success) {
        WebApp.showAlert("✅ Film Telegram botingizga (Chatga) yuborildi! Yopib ko'rishingiz mumkin.");
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

  if (!movie) {
      return <div className="p-8 text-center text-zinc-400 mt-10">Film topilmadi.</div>
  }

  return (
    <div className="flex flex-col pb-24">
      <div className="relative w-full aspect-square md:aspect-video max-h-[60vh] bg-zinc-900 border-b border-zinc-800">
        <img 
          src={movie.poster} 
          className="w-full h-full object-cover brightness-[0.6]" 
          alt={movie.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{movie.title}</h1>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col gap-6">
        
        {movie.languages?.length > 0 ? (
            <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-zinc-400">Tilni tanlang:</label>
               <div className="flex flex-wrap gap-2">
                 {movie.languages.map((l) => (
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
        ) : (
            <div className="p-4 rounded border border-yellow-900 border-dashed bg-yellow-950 text-yellow-600 font-medium text-sm">
               Ushbu filmga hali video qoshilmagan.
            </div>
        )}

        {movie.languages?.length > 0 && (
            <button
              onClick={handleWatch}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Play fill="white" className="w-5 h-5" />
              <span>Telegramda ko'rish</span>
            </button>
        )}

        <div className="flex flex-col gap-2 mt-4">
           <h3 className="text-lg font-bold text-white">Tavsif</h3>
           <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
             {movie.description}
           </p>
        </div>

      </div>
    </div>
  );
}
