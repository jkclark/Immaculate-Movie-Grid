import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Credit } from "./Credit";
import { Genre } from "./Genre";

@Entity({ name: "credits_genres_join" })
export class CreditGenreJoin {
  @PrimaryColumn()
  credit_id!: number;

  @PrimaryColumn()
  genre_id!: number;

  @ManyToOne(() => Credit, (credit) => credit.id)
  @JoinColumn({ name: "credit_id" })
  credit!: Credit;

  @ManyToOne(() => Genre, (genre) => genre.id)
  @JoinColumn({ name: "genre_id" })
  genre!: Genre;
}
