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
            <a href="https://www.immaculategrid.com/" className="underline">
              Immaculate Grid
            </a>
            .
          </p>
          <br />

          {/* Credits */}
          <h1 className="text-3xl font-bold">Credits</h1>
          <br />
          <p className="text-base">
            All of the data used in this game comes from the amazing{" "}
            <a href="https://www.themoviedb.org/" className="underline">
              TMDB
            </a>
            , who generously provide a free-to-use API.
          </p>
          <br />
          <p>
            The game also uses{" "}
            <a href="https://www.flaticon.com/packs/cinema-183" className="underline">
              icons created by Freepik
            </a>
            .
          </p>
          <br />

          {/* Support me */}
          <h1 className="text-3xl font-bold">Support me</h1>
          <br />
          <p>
            This website is built and maintained by one person (me, Josh). If you enjoying playing the grid
            and would like to support its development, please consider donating here:
          </p>
          <br />
          <a href="https://ko-fi.com/G2G71940FL" target="_blank">
            <img
              style={{ border: 0, height: "36px" }}
              src="https://storage.ko-fi.com/cdn/kofi2.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
        </div>
      }
    />
  );
};

export default AboutDisplay;
