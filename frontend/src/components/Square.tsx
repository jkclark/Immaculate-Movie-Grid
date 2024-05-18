import React from 'react';

interface SquareProps {
  text: string;
  imageURL: string;
}

const Square: React.FC<SquareProps> = ({ text, imageURL }) => {
  return (
    <div className="aspect-content aspect-w-1 aspect-h-1">
      <div className="aspect-content">
        <img src={imageURL} alt={text} />
        <p className="text-center">{text}</p>
      </div>
    </div>
  );
};

export default Square;
