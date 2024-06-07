import React from "react";
import SimpleTextDisplay from "./SimpleTextDisplay";

const AboutDisplay: React.FC = () => {
  return (
    <SimpleTextDisplay
      content={
        <div>
          {/* General */}
          <h1 className="text-3xl font-bold">About Immaculate Movie Grid</h1>
          <br />
          <p className="text-base">
            This game was inspired by the similar, baseball-themed{" "}
            <a href="https://www.immaculategrid.com/" className="text-blue-500 underline">
              Immaculate Grid
            </a>
            .
          </p>
          <br />
          <br />

          {/* Credits */}
          <h1 className="text-3xl font-bold">Credits</h1>
          <br />
          <p className="text-base">
            All of the data for this game comes from the amazing{" "}
            <a href="https://www.themoviedb.org/" className="text-blue-500 underline">
              TMDB
            </a>
            , who generously provide a free-to-use API.
          </p>
          <p>
            The game also uses{" "}
            <a href="https://www.flaticon.com/packs/cinema-183" className="text-blue-500 underline">
              icons created by Freepik
            </a>
            .
          </p>
        </div>
      }
    />
  );
};

export default AboutDisplay;
