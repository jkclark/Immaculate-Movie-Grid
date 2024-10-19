import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Grid } from "./Grid";

@Entity({ name: "scores" })
export class Score {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "date" })
  grid_date!: Date;

  @ManyToOne(() => Grid, (grid) => grid.date)
  @JoinColumn({ name: "grid_date", referencedColumnName: "date" })
  grid!: Grid;

  @Column("int")
  score!: number;
}
