import { ConnectionData } from "./graph";

export interface Category {
  id: number;
  name: string;
  connectionFilter: (connection: ConnectionData) => boolean;
}
