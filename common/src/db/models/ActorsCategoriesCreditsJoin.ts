import { Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";
import { ActorOrCategory } from "./ActorOrCategory";
import { Credit } from "./Credit";

@Entity()
export class ActorOrCategoryCreditJoin {
  @PrimaryColumn()
  actorOrCategoryId!: number;

  @PrimaryColumn()
  creditId!: number;

  @ManyToMany(() => ActorOrCategory)
  @JoinTable({
    name: "actors_categories_credits_join",
    joinColumns: [{ name: "actor_category_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "credit_id", referencedColumnName: "id" }],
  })
  actors!: ActorOrCategory[];

  @ManyToMany(() => Credit)
  @JoinTable({
    name: "actors_categories_credits_join",
    joinColumns: [{ name: "actor_category_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "credit_id", referencedColumnName: "id" }],
  })
  credits!: Credit[];
}
