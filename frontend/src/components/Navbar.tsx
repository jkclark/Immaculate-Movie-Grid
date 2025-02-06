import React, { useState } from "react";
import AboutDisplay from "./AboutDisplay";
import DarkModeToggle from "./DarkModeToggle";
import HowToPlayDisplay from "./HowToPlayDisplay";
import { useOverlayStack } from "./Overlay";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addContentsToOverlay } = useOverlayStack();

  return (
    <nav className="relative flex items-center justify-between flex-wrap bg-theme-secondary px-4 py-2 w-full z-20">
      <div className="flex items-center flex-shrink-0 theme-text mr-6">
        <span className="font-semibold text-xl tracking-tight">Immaculate Movie Grid</span>
      </div>
      <div className="block lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-2 bg-theme-other-1 border rounded theme-text border-theme-light-text dark:border-theme-dark-text hover:bg-theme-other-2"
        >
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>
      <div
        className={`${isOpen ? "block" : "hidden"} absolute w-full top-full left-0 pb-1 bg-theme-secondary lg:relative lg:flex lg:items-center lg:w-auto lg:top-0 lg:pb-0`}
      >
        <a
          href="#responsive-header"
          className="block mt-4 lg:inline-block lg:mt-0 theme-text mr-4 pl-4 lg:pl-0"
          // e.preventDefault prevents the URL from changing
          onClick={(e) => {
            e.preventDefault();
            addContentsToOverlay(<HowToPlayDisplay />);
          }}
        >
          How to play
        </a>
        <a
          href="#responsive-header"
          className="block mt-4 lg:inline-block lg:mt-0 theme-text pl-4 lg:pl-0 mb-3 lg:mb-0 lg:mr-3"
          // e.preventDefault prevents the URL from changing
          onClick={(e) => {
            e.preventDefault();
            addContentsToOverlay(<AboutDisplay />);
          }}
        >
          About
        </a>
        <DarkModeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
