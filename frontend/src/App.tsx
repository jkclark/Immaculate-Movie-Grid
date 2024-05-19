// import React from 'react';
import { useEffect, useState } from 'react';
import Grid from './components/Grid';
import { getGridDataFromS3 } from './s3';
import { Grid as GridData } from '../../common/src/interfaces';
import SearchBar from './components/SearchBar';

function App() {
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        console.log("Grid data already fetched");
        console.log(gridData);
        return;
      }

      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", "test-grid-graph.json");
      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
    }
    fetchData();
  }, [gridData]);

  return (
    <div className="w-full flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white">
      <SearchBar />
      <Grid {...gridData} />
    </div>
  );
}

export default App;
