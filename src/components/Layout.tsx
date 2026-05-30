import { Outlet, useLocation, useNavigate } from "react-router";
import { Search, Home as HomeIcon } from "lucide-react";
import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { cn } from "../utils/cn";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/") {
      WebApp.BackButton.hide();
    } else {
      WebApp.BackButton.show();
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center h-16 px-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
            location.pathname === "/" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] uppercase font-medium tracking-wider">Asosiy</span>
        </button>
        <button
          onClick={() => navigate("/search")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
            location.pathname === "/search" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] uppercase font-medium tracking-wider">Qidirish</span>
        </button>
      </nav>
    </div>
  );
}
