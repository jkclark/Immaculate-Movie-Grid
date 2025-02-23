import { atom, useAtom, useSetAtom } from "jotai";
import React, { useEffect, useState } from "react";
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
  // For the opacity transition
  const [isVisible, setIsVisible] = useState(false);

  const transitionDuration = 300;
  const transitionDurationClassName = `transition-opacity duration-${transitionDuration} ease-in-out`;

  function closeOverlay() {
    setIsVisible(false);

    // The timeout is to allow the opacity transition to finish before clearing the overlay contents
    setTimeout(() => {
      resetOverlayContents();

      // This is only relevant when the game is ongoing, but that doesn't really matter
      setSelectedRow(-1);
      setSelectedCol(-1);
    }, transitionDuration);
  }

  // Close overlay on escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeOverlay();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (peekOverlayContents()) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [peekOverlayContents()]);

  const topOverlayContents = peekOverlayContents();

  return (
    topOverlayContents && (
      <div
        onClick={closeOverlay}
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 ${transitionDurationClassName} ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        {topOverlayContents}
      </div>
    )
  );
};

export default Overlay;
