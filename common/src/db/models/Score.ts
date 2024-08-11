import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Grid } from "./Grid";

@Entity({ name: "scores" })
export class Score {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Grid)
  @JoinColumn({ name: "grid_id" })
  grid!: Grid;

  @Column("int")
  score!: number;
}
