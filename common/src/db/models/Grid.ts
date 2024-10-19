import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ActorOrCategory } from "./ActorOrCategory";

@Entity({ name: "grids" })
export class Grid {
  @PrimaryColumn("date")
  date!: Date;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_1", referencedColumnName: "id" })
  across1!: number;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_2", referencedColumnName: "id" })
  across2!: number;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_3", referencedColumnName: "id" })
  across3!: number;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_1", referencedColumnName: "id" })
  down1!: number;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_2", referencedColumnName: "id" })
  down2!: number;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_3", referencedColumnName: "id" })
  down3!: number;
}
