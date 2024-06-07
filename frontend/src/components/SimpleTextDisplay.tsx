import React from "react";

interface SimpleTextDisplayProps {
  content: JSX.Element;
}

const SimpleTextDisplay: React.FC<SimpleTextDisplayProps> = ({ content }) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col md:flex-row bg-white dark:bg-gray-800 w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-2 md:p-6 relative overflow-auto"
    >
      {content}
    </div>
  );
};

export default SimpleTextDisplay;
