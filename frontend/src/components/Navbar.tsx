import React, { useState } from "react";
import AboutDisplay from "./AboutDisplay";
import DarkModeToggle from "./DarkModeToggle";
import HowToPlayDisplay from "./HowToPlayDisplay";
import { useOverlayStack } from "./Overlay";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addContentsToOverlay } = useOverlayStack();

  return (
    <nav className="relative flex items-center justify-between flex-wrap bg-theme-light-secondary dark:bg-theme-dark-secondary px-4 py-2 w-full z-10">
      <div className="flex items-center flex-shrink-0 text-gray-900 dark:text-white mr-6">
        <span className="font-semibold text-xl tracking-tight">Immaculate Movie Grid</span>
      </div>
      <div className="block lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-2 bg-theme-light-other-1 dark:bg-theme-dark-other-1 border rounded text-gray-900 dark:text-white border-gray-900 dark:border-white hover:bg-theme-light-other-2 hover:dark:bg-theme-dark-other-2"
        >
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>
      <div
        className={`${isOpen ? "block" : "hidden"} absolute w-full bg-theme-light-secondary dark:bg-theme-dark-secondary lg:relative lg:flex lg:items-center lg:w-auto mt-30 lg:mt-0 -ml-4`}
      >
        <a
          href="#responsive-header"
          className="block mt-4 lg:inline-block lg:mt-0 text-gray-900 dark:text-white hover:text-blue-500 mr-4 pl-4 lg:pl-0"
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
          className="block mt-4 lg:inline-block lg:mt-0 text-gray-900 dark:text-white hover:text-blue-500 pl-4 lg:pl-0 mb-3 lg:mb-0 lg:mr-3"
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
