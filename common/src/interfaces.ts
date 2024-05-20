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
    answers: { [key: number]: { type: "movie" | "tv", id: number }[] } // actor id -> [{type, id}, ...]
}

export interface SearchResult {
    media_type: string;
    id: number;
    title: string;
}
