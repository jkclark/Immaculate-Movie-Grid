import React, { useState } from 'react';

interface SquareProps {
  initialRow: number;
  initialColumn: number;
  text: string;
}

const Square: React.FC<SquareProps> = ({ initialRow, initialColumn, text }) => {
  const [row, setRow] = useState(initialRow);
  const [column, setColumn] = useState(initialColumn);
  // This causes lots of output in the console, but shuts up the compiler.
  console.log(row, setRow, column, setColumn);

  return (
    <div className="aspect-content aspect-w-1 aspect-h-1">
      <div className="aspect-content">
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Square;
