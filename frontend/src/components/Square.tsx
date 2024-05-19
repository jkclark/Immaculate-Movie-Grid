import React from 'react';

interface SquareProps {
  row: number;
  col: number;
  text: string;
  imageURL: string;
  setSelectedRow: (row: number) => void;
  setSelectedCol: (col: number) => void;
}

const Square: React.FC<SquareProps> = ({
  row,
  col,
  text,
  imageURL,
  setSelectedRow,
  setSelectedCol,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    // Necessary to prevent the page's click handler from resetting this state
    event.stopPropagation();
    setSelectedRow(row);
    setSelectedCol(col);
  };

  return (
    <div onClick={handleClick} className="w-full aspect-[2/3] flex items-center justify-center">
      <img src={imageURL} alt={text} className="max-w-full max-h-full object-cover" />
    </div>
  );
};

export default Square;
