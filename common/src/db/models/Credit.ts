import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "credits" })
export class Credit {
  @PrimaryColumn()
  id!: number;

  @Column()
  type!: string;

  @Column()
  name!: string;

  @Column("float")
  popularity!: number;

  @Column("date")
  release_date!: Date;

  @Column()
  rating!: string;
}
