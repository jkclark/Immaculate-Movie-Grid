export const YOUR_ANSWERS_TAB_TEXT = "Your answers";
export const ALL_CORRECT_ANSWERS_TAB_TEXT = "All correct answers";
export const ACCURACY_TAB_TEXT = "Accuracy";
export const MOST_COMMON_ANSWERS_TAB_TEXT = "Most common answers";

export const CATEGORY_IDS_TO_DESCRIPTIONS: { [key: string]: JSX.Element } = {
  "-1": (
    <div>
      The movie or TV show must have the specified rating according to the{" "}
      <a target="_blank" href="https://en.wikipedia.org/wiki/Motion_Picture_Association#Film_rating_system">
        MPAA{" "}
      </a>{" "}
      or{" "}
      <a target="_blank" href="https://en.wikipedia.org/wiki/TV_Parental_Guidelines#Ratings">
        TV Parental Guidelines
      </a>
    </div>
  ),
  "-2": <div>The movie or TV show must have been released during or after the year 2000</div>,
  "-3": <div>The movie or TV show must have been released before the year 2000</div>,
  "-4": (
    <div>
      The movie or TV show must be classified in the comedy genre, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-5": (
    <div>
      The movie or TV show must be classified as animated, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-6": (
    <div>
      The movie or TV show must be classified in the crime genre, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-7": (
    <div>
      The movie or TV show must be classified in the drama genre, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-8": (
    <div>
      The movie or TV show must be classified in either the Sci-Fi or Fantasy genres, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-9": (
    <div>
      The movie or TV show must be classified in the myster genre, as per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-10": <div>Words are separated by spaces or slashes but not by hyphens</div>,
};
