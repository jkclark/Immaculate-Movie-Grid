import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Credit } from "./Credit";
import { Genre } from "./Genre";

@Entity({ name: "credits_genres_join" })
export class CreditGenreJoin {
  @PrimaryColumn()
  creditId!: number;

  @PrimaryColumn()
  genreId!: number;

  @ManyToOne(() => Credit, (credit) => credit.id)
  credit!: Credit;

  @ManyToOne(() => Genre, (genre) => genre.id)
  genre!: Genre;
}
