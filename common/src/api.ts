import "node-fetch";

// import dotenv
import dotenv from "dotenv";
dotenv.config();

console.log("TMDB API KEY: " + process.env.TMDB_API_KEY);

export async function getFromTMDBAPI(url: string): Promise<any> {
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
        }
    };

    return await fetch(url, options);
}

export async function getFromTMDBAPIJson(url: string): Promise<any> {
    const response = await getFromTMDBAPI(url);
    return await response.json();
}
