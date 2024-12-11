import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Credit } from "./Credit";
import { Grid } from "./Grid";
import { Score } from "./Score";

@Entity({ name: "guesses" })
export class Guess {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "date" })
  grid_date!: Date;

  @ManyToOne(() => Grid, (grid) => grid.date)
  @JoinColumn({ name: "grid_date", referencedColumnName: "date" })
  grid!: Grid;

  @Column("int", { nullable: true })
  score_id!: number;

  @ManyToOne(() => Score, { nullable: true })
  @JoinColumn({ name: "score_id", referencedColumnName: "id" })
  score?: Score;

  @Column("int")
  across_index!: number;

  @Column("int")
  down_index!: number;

  @Column("int")
  credit_id!: number;

  @Column("varchar")
  credit_type!: string;

  @ManyToOne(() => Credit)
  @JoinColumn([
    { name: "credit_id", referencedColumnName: "id" },
    { name: "credit_type", referencedColumnName: "type" },
  ])
  credit!: Credit;

  @Column("boolean")
  correct!: boolean;
}
