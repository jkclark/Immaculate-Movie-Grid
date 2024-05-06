export interface Actor {
  id: number;
  name: string;
}

export interface Credit {
  type: "movie" | "tv";
  id: number;
  name: string;
}
