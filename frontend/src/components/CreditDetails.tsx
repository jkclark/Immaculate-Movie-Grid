import React from "react";

import { CreditExport } from "common/src/interfaces";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "../s3";
import ImageWithBackup from "./ImageWithBackup";
import { useOverlayStack } from "./Overlay";

interface CreditDetailsProps {
  credit: CreditExport;
}

const CreditDetails: React.FC<CreditDetailsProps> = ({ credit }) => {
  const { popOverlayContents } = useOverlayStack();
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-start md:flex-row bg-theme-light-primary dark:bg-theme-dark-primary w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-3 md:p-6 relative"
    >
      <svg
        onClick={() => popOverlayContents()}
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 absolute top-2 right-2 cursor-pointer hover:text-theme-light-other-1 hover:dark:text-theme-dark-other-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <ImageWithBackup
        imageURL={getS3ImageURLForType(credit.type, credit.id)}
        altText={credit.name}
        backupImageURL={getS3BackupImageURLForType(credit.type)}
        className="h-full"
      />
      <div className="ml-4">
        <h2 className="font-bold text-2xl">{credit.name}</h2>
      </div>
    </div>
  );
};

export default CreditDetails;
