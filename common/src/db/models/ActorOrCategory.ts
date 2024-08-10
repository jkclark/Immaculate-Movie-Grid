import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "actors_and_categories" })
export class ActorOrCategory {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;
}
