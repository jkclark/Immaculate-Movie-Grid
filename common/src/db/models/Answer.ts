import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Grid } from "./Grid";

@Entity({ name: "answers" })
export class Answer {
  @PrimaryGeneratedColumn()
  id!: number;

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
