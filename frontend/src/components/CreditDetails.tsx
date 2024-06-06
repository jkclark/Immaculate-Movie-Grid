import React from "react";
import { CreditExport } from "../../../common/src/interfaces";
import { getS3BackupImageURLForType, getS3ImageURLForType } from "../s3";
import ImageWithBackup from "./ImageWithBackup";

interface CreditDetailsProps {
  credit: CreditExport;
}

const CreditDetails: React.FC<CreditDetailsProps> = ({ credit }) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-start md:flex-row bg-white dark:bg-gray-800 w-4/5 md:w-2/3 max-w-[800px] h-1/2 rounded-lg shadow-lg p-2 md:p-6 relative"
    >
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
