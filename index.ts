import { S3 } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import "node-fetch";

import { writeTextToS3 } from "./s3";

dotenv.config();

const url = "https://api.themoviedb.org/3/movie/18785?language=en-US";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error("error:" + err));


writeTextToS3("Hello, S3!", "movie-grid-daily-games", "test.txt");
