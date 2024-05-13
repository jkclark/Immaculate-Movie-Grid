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

export interface ActorExport {
  id: number;
  name: string;
}

export interface CreditExport {  // For now this is the same as Credit
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface GridExport {
  actors: Actor[];
  credits: Credit[];
  answers: { [key: number]: number[] }  // actor id -> credit id[]
}
