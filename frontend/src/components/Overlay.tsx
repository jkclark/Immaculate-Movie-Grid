import { atom, useAtom, useSetAtom } from "jotai";
import React from "react";
import { selectedColAtom, selectedRowAtom } from "../state";

const overlayContentsAtom = atom<JSX.Element[]>([]);

export function useOverlayStack() {
  const [overlayStack, setOverlayStack] = useAtom(overlayContentsAtom);

  const addContentsToOverlay = (element: JSX.Element) => {
    setOverlayStack((prevStack) => [...prevStack, element]);
  };

  const popOverlayContents = () => {
    setOverlayStack((prevStack) => prevStack.slice(0, -1));
  };

  const peekOverlayContents = () => {
    return overlayStack[overlayStack.length - 1];
  };

  const resetOverlayContents = () => {
    setOverlayStack([]);
  };

  return { addContentsToOverlay, popOverlayContents, peekOverlayContents, resetOverlayContents };
}

const Overlay: React.FC = () => {
  const setSelectedRow = useSetAtom(selectedRowAtom);
  const setSelectedCol = useSetAtom(selectedColAtom);
  const { peekOverlayContents, resetOverlayContents } = useOverlayStack();

  function closeOverlay() {
    resetOverlayContents();

    // This is only relevant when the game is ongoing, but that doesn't really matter
    setSelectedRow(-1);
    setSelectedCol(-1);
  }

  const topOverlayContents = peekOverlayContents();

  return (
    topOverlayContents && (
      <div
        onClick={closeOverlay}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      >
        {topOverlayContents}
      </div>
    )
  );
};

export default Overlay;
