import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { ActorOrCategory } from "./ActorOrCategory";

@Entity({ name: "grids" })
export class Grid {
  @Column("date")
  date!: Date;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_1" })
  across1!: ActorOrCategory;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_2" })
  across2!: ActorOrCategory;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "across_3" })
  across3!: ActorOrCategory;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_1" })
  down1!: ActorOrCategory;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_2" })
  down2!: ActorOrCategory;

  @ManyToOne(() => ActorOrCategory)
  @JoinColumn({ name: "down_3" })
  down3!: ActorOrCategory;
}
