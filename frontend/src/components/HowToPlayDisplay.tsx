import React from "react";
import SimpleTextDisplay from "./SimpleTextDisplay";

const HowToPlayDisplay: React.FC = () => {
  return (
    <SimpleTextDisplay
      content={
        <div>
          <h1 className="text-3xl font-bold">How to play</h1>
          <br />

          <p className="text-base">
            Your goal is to fill in the grid. For each square in the grid, you need to find a movie or TV show
            that satisfies that square's row and column requirements.
          </p>
          <br />

          <p>
            For example, if a square lies at the intersection of Marlon Brando and Al Pacino, you could fill
            in that square with{" "}
            <span className="bg-black text-black hover:text-white transition-colors duration-300 italic">
              The Godfather
            </span>
            .
          </p>
          <br />

          <p>Tap on a square to search for a movie or TV show that satisifes its requirements.</p>
          <br />

          <p>You get 9 guesses, right or wrong, for 9 squares. The goal is to be ✨immaculate✨</p>
          <br />

          <p>You cannot use the same movie or TV show more than once in the grid.</p>
          <br />

          <p>
            You can hover/tap on an actor to see their name. Hover/tap on a category to see details about it.
          </p>
        </div>
      }
    />
  );
};

export default HowToPlayDisplay;
