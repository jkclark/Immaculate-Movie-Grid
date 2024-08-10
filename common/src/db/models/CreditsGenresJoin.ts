import { Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";
import { Credit } from "./Credit";
import { Genre } from "./Genre";

@Entity()
export class CreditGenreJoin {
  @PrimaryColumn()
  creditId!: number;

  @PrimaryColumn()
  genreId!: number;

  @ManyToMany(() => Credit)
  @JoinTable({
    name: "credit_genres_join",
    joinColumns: [{ name: "credit_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "genre_id", referencedColumnName: "id" }],
  })
  credits!: Credit[];

  @ManyToMany(() => Genre)
  @JoinTable({
    name: "credit_genres_join",
    joinColumns: [{ name: "credit_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "genre_id", referencedColumnName: "id" }],
  })
  genres!: Genre[];
}
