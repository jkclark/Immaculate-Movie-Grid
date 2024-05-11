import React, { useState } from 'react';

interface SquareProps {
  initialRow: number;
  initialColumn: number;
}

const Square: React.FC<SquareProps> = ({ initialRow, initialColumn }) => {
  const [row, setRow] = useState(initialRow);
  const [column, setColumn] = useState(initialColumn);

  return (
    <div>
      <p>Row: {row}</p>
      <p>Column: {column}</p>
    </div>
  );
};

export default Square;
