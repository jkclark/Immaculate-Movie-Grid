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
    <div onClick={handleClick} className="w-full h-full aspect-[2/3] flex items-center justify-center relative group">
      <img src={imageURL} alt={text} className="h-full" />
      {(text &&
        <>
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-100"></div>
          <div className="absolute inset-0 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            <p className="text-white hover:cursor-default">{text}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Square;
