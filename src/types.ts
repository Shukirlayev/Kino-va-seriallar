export type MovieDto = {
  id: number;
  title: string;
  description: string;
  poster: string;
  languages: { id: number; language: string; fileId: string }[];
};

export type SeriesDto = {
  id: number;
  title: string;
  description: string;
  poster: string;
  seasons: SeasonDto[];
};

export type SeasonDto = {
  id: number;
  seasonNum: number;
  episodes: EpisodeDto[];
};

export type EpisodeDto = {
  id: number;
  episodeNum: number;
  languages: { id: number; language: string; fileId: string }[];
};

export type ContentResponse = {
  movies: MovieDto[];
  series: SeriesDto[];
};
