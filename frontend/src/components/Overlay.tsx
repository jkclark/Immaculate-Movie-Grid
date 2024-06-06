import { atom, useSetAtom } from "jotai";
import React from "react";
import { selectedColAtom, selectedRowAtom } from "../state/GameState";

interface OverlayProps {
  contents: JSX.Element | null;
}

export const overlayContentsAtom = atom<JSX.Element | null>(null);

const Overlay: React.FC<OverlayProps> = ({ contents }) => {
  const setSelectedRow = useSetAtom(selectedRowAtom);
  const setSelectedCol = useSetAtom(selectedColAtom);
  const setOverlayContents = useSetAtom(overlayContentsAtom);

  function closeOverlay() {
    setOverlayContents(null);

    // This is only relevant when the game is ongoing, but that doesn't really matter
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  return (
    contents && (
      <div
        onClick={closeOverlay}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      >
        {contents}
      </div>
    )
  );
};

export default Overlay;
