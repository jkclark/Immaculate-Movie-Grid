export interface Actor {
  id: number;
  name: string;
  credits: Set<Credit>;
}

export interface Credit {
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface Connection {
  actor1: Actor;
  actor2: Actor;
  credit: Credit;
}

export interface Grid {
  actors: Actor[];
  connections: Connection[];
}
