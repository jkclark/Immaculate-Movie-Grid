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
    <div onClick={handleClick} className="aspect-content aspect-w-1 aspect-h-1 w-full h-full">
      <div className="aspect-content">
        <img src={imageURL} alt={text} />
        <p className="text-center">{text}</p>
      </div>
    </div>
  );
};

export default Square;
