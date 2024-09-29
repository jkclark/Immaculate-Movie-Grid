import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "credits" })
export class Credit {
  @PrimaryColumn()
  id!: number;

  @PrimaryColumn()
  type!: string;

  @Column()
  name!: string;

  @Column("float", { nullable: true })
  popularity!: number;

  @Column("date", { nullable: true })
  release_date!: Date;

  @Column("date", { nullable: true })
  last_air_date!: Date;

  @Column("varchar", { nullable: true })
  rating!: string;
}
