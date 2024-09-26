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

  @Column("date", { nullable: true })
  release_date!: Date;

  @Column("date", { nullable: true })
  last_air_date!: Date;

  @Column("varchar", { nullable: true })
  rating!: string;
}
