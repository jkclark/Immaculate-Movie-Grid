import React from "react";

interface ImageWithBackupProps {
  imageURL: string;
  altText: string;
  backupImageURL: string;
  className: string;
}

const ImageWithBackup: React.FC<ImageWithBackupProps> = ({
  imageURL,
  altText,
  backupImageURL,
  className,
}) => {
  return (
    <img
      src={imageURL}
      alt={altText}
      // If we can't find the image at the imageURL, try the backupImageURL
      // The second part of the condition prevents an infinite loop if the backupImageURL is also invalid
      onError={(e) => {
        if (backupImageURL && (e.target as HTMLImageElement).src !== backupImageURL) {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src = backupImageURL;
        }
      }}
      className={className}
    />
  );
};

export default ImageWithBackup;
