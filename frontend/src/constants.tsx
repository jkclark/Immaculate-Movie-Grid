export const YOUR_ANSWERS_TAB_TEXT = "Your answers";
export const ALL_CORRECT_ANSWERS_TAB_TEXT = "All correct answers";
export const ACCURACY_TAB_TEXT = "Accuracy";
export const MOST_COMMON_ANSWERS_TAB_TEXT = "Most common answers";

export const CATEGORY_IDS_TO_TOOLTIP_TEXTS: { [key: number]: JSX.Element } = {
  // 0 = actor
  "0": (
    <div>
      The movie or TV show's cast must contain the actor, as per{" "}
      <a target="_blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  // All other numbers = category
  "-1": (
    <div>
      As per{" "}
      <a target="_blank" href="https://en.wikipedia.org/wiki/Motion_Picture_Association#Film_rating_system">
        MPAA{" "}
      </a>{" "}
      or{" "}
      <a target="_blank" href="https://en.wikipedia.org/wiki/TV_Parental_Guidelines#Ratings">
        TV Parental Guidelines
      </a>
    </div>
  ),
  "-2": (
    <div>
      1999 ❌<br />
      2000 ❌<br />
      2001 ✅
    </div>
  ),
  "-3": (
    <div>
      1999 ✅<br />
      2000 ✅<br />
      2001 ❌
    </div>
  ),
  "-4": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-5": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-6": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-7": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-8": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-9": (
    <div>
      As per{" "}
      <a target="blank" href="https://www.themoviedb.org">
        TMDB
      </a>
    </div>
  ),
  "-10": <div>Words are separated by spaces or slashes but not by hyphens</div>,
};
