import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { ActorOrCategory } from "./models/ActorOrCategory";
import { ActorOrCategoryCreditJoin } from "./models/ActorsCategoriesCreditsJoin";
import { Answer } from "./models/Answer";
import { Credit } from "./models/Credit";
import { CreditGenreJoin } from "./models/CreditsGenresJoin";
import { Genre } from "./models/Genre";
import { Grid } from "./models/Grid";
import { Score } from "./models/Score";

dotenv.config();

const allEntities = [
  ActorOrCategory,
  Credit,
  Genre,
  ActorOrCategoryCreditJoin,
  CreditGenreJoin,
  Grid,
  Score,
  Answer,
];

// NOTE: We would really like to use the values from Secrets Manger to access the database.
// However, I'm having issues related to having an await statement in the top level of the file.
// Supposedly, this is allowed with different `module` values in the tsconfig.json file.
// At this point, I'm too afraid to change that, given how much trouble it's shown to be in the past.
// So, I'm just going to use environment variables for now. This means updating each Lambda function
// that connects to the database whenever the database credentials change.
const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || "5432");
const POSTGRES_DB = process.env.POSTGRES_DB;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  synchronize: false, // set to false in production
  logging: false,
  entities: allEntities,
  migrations: [],
  subscribers: [],
  // This resolve the following error:
  // Error initializing database:  error: no pg_hba.conf entry for host "<REDACTED_DB_HOST>", user "postgres", database "movie_grid", no encryption
  ssl: {
    rejectUnauthorized: false,
  },
});

let dataSourceInitialized = false;

export const initializeDataSource = async () => {
  if (!dataSourceInitialized) {
    await AppDataSource.initialize();
    dataSourceInitialized = true;
  }
};
