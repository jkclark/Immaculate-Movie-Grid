import { useAtom } from "jotai";
import { ActorSquareMode, actorSquareModeAtom } from "../state";

const ActorModeToggle: React.FC = () => {
  const [actorSquareMode, setActorSquareMode] = useAtom(actorSquareModeAtom);

  function toggleActorSquareMode() {
    if (actorSquareMode === ActorSquareMode.PHOTO) {
      setActorSquareMode(ActorSquareMode.NAME);
    } else if (actorSquareMode === ActorSquareMode.NAME) {
      setActorSquareMode(ActorSquareMode.PHOTO);
    } else {
      console.error("Invalid actor square mode");
    }
  }

  return (
    <button className="selected-tab" onClick={toggleActorSquareMode}>
      Show {actorSquareMode === ActorSquareMode.NAME ? "photos" : "names"}
    </button>
  );
};

export default ActorModeToggle;
