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

export interface ActorExport {
  id: number;
  name: string;
}

export interface CreditExport {  // For now this is the same as Credit
  type: "movie" | "tv";
  id: number;
  name: string;
}

export interface Grid {
  actors: ActorExport[];
  credits: CreditExport[];
  answers: { [key: number]: number[] }  // actor id -> credit id[]
}
