import { Routes, Route, useNavigate } from "react-router";
import { Home } from "./pages/Home";
import { MovieDetails } from "./pages/MovieDetails";
import { SeriesDetails } from "./pages/SeriesDetails";
import { Search } from "./pages/Search";
import { Layout } from "./components/Layout";
import WebApp from "@twa-dev/sdk";
import { useEffect } from "react";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Telegram BackButton
    WebApp.BackButton.onClick(() => {
      navigate(-1);
    });
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="movie/:id" element={<MovieDetails />} />
        <Route path="series/:id" element={<SeriesDetails />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  );
}
