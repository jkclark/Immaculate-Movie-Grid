import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ActorOrCategory } from "./ActorOrCategory";
import { Credit } from "./Credit";

@Entity({ name: "actors_categories_credits_join" })
export class ActorOrCategoryCreditJoin {
  @PrimaryColumn()
  actor_category_id!: number;

  @PrimaryColumn()
  credit_id!: number;

  @PrimaryColumn()
  credit_type!: string;

  @ManyToOne(() => ActorOrCategory, (actorOrCategory) => actorOrCategory.id)
  @JoinColumn({ name: "actor_category_id" })
  actorOrCategory!: ActorOrCategory;

  @ManyToOne(() => Credit, (credit) => credit.id)
  @JoinColumn([
    { name: "credit_id", referencedColumnName: "id" },
    { name: "credit_type", referencedColumnName: "type" },
  ])
  credit!: Credit;
}
