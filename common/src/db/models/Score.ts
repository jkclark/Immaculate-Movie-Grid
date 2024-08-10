import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Grid } from "./Grid";

@Entity({ name: "scores" })
export class Score {
  @ManyToOne(() => Grid)
  @JoinColumn({ name: "grid_id" })
  grid!: Grid;

  @Column("int")
  score!: number;
}
