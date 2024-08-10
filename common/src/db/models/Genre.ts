import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "genres" })
export class Genre {
  @PrimaryColumn()
  id!: number;

  @Column()
  name!: string;
}
