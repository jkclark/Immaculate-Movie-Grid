import * as dotenv from "dotenv";
import "node-fetch";

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
