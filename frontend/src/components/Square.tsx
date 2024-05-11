import React, { useState } from 'react';

interface SquareProps {
  initialRow: number;
  initialColumn: number;
}

const Square: React.FC<SquareProps> = ({ initialRow, initialColumn }) => {
  const [row, setRow] = useState(initialRow);
  const [column, setColumn] = useState(initialColumn);

  return (
    <div className="aspect-content aspect-w-1 aspect-h-1">
      <div className="aspect-content">
        <p>Row: {row}</p>
        <p>Column: {column}</p>
      </div>
    </div>
  );
};

export default Square;
