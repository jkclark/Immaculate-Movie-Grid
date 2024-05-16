// import React from 'react';
import { useEffect, useState } from 'react';
import Grid from './components/Grid';
import { getGridDataFromS3 } from './s3';
import { Grid as GridData } from '../../common/interfaces';

function App() {
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        console.log("Grid data already fetched");
        console.log(gridData);
        return;
      }

      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", "test-grid.json");
      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
    }
    fetchData();
  }, [gridData]);

  return (
    <div className="container mx-auto flex items-center justify-center h-screen">
      <Grid {...gridData} />
    </div>
  );
}

export default App;
