import React from "react";

interface SimpleTextDisplayProps {
  content: JSX.Element;
}

const SimpleTextDisplay: React.FC<SimpleTextDisplayProps> = ({ content }) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col md:flex-row bg-theme-primary w-4/5 max-w-[800px] h-3/4 rounded-lg shadow-lg py-3 px-4 md:p-6 relative overflow-auto theme-text"
    >
      {content}
    </div>
  );
};

export default SimpleTextDisplay;
