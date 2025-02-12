import React, { useState } from "react";
import ImageWithBackup from "./ImageWithBackup";

interface ImageSquareProps {
  imageURL: string;
  hoverText: string;
  backupImageURL: string;
  clickHandler?: (event: React.MouseEvent) => void;
  roundedCornerClassName?: string;
}

const ImageSquare: React.FC<ImageSquareProps> = ({
  imageURL,
  hoverText,
  backupImageURL,
  clickHandler,
  roundedCornerClassName,
}) => {
  const [isTextVisible, setIsTextVisible] = useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleClick = (event: React.MouseEvent) => {
    if (isMobile) {
      setIsTextVisible(!isTextVisible);
    }

    if (clickHandler) {
      clickHandler(event);
    }
  };

  return (
    <div onClick={handleClick} className="w-full h-full flex items-center justify-center relative group">
      <ImageWithBackup
        imageURL={imageURL}
        altText={hoverText}
        backupImageURL={backupImageURL}
        className="h-full object-contain"
      />
      <div
        className={`absolute inset-0 bg-black ${isMobile ? (isTextVisible ? "opacity-50" : "opacity-0") : "opacity-0 group-hover:opacity-50"} transition-opacity duration-100 ${roundedCornerClassName}`}
      ></div>
      <div
        className={`absolute inset-0 flex items-center justify-center text-center ${isMobile ? (isTextVisible ? "opacity-100" : "opacity-0") : "opacity-0 group-hover:opacity-100"} transition-opacity duration-100`}
      >
        <p className="text-white hover:cursor-default">{hoverText}</p>
      </div>
    </div>
  );
};

export default ImageSquare;
