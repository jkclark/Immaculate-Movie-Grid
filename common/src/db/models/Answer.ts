import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Grid } from "./Grid";

@Entity({ name: "answers" })
export class Answer {
  @ManyToOne(() => Grid)
  @JoinColumn({ name: "grid_id" })
  grid!: Grid;

  @Column("int")
  across_index!: number;

  @Column("int")
  down_index!: number;

  @Column("int")
  credit_id!: number;

  @Column("boolean")
  correct!: boolean;
}
