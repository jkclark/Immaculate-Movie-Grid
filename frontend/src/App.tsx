// import React from 'react';
import { useEffect, useState } from 'react';
import Grid from './components/Grid';
import { getGridDataFromS3 } from './s3';
import { Grid as GridData } from '../../common/src/interfaces';
import SearchBar from './components/SearchBar';

function App() {
  const [gridData, setGridData]: [GridData, any] = useState({} as GridData);
  const [selectedRow, setSelectedRow] = useState(-1);
  const [selectedCol, setSelectedCol] = useState(-1);

  useEffect(() => {
    async function fetchData() {
      if (Object.keys(gridData).length > 0) {
        return;
      }

      const jsonData = await getGridDataFromS3("immaculate-movie-grid-daily-grids", "test-grid-graph.json");
      console.log("Grid data:");
      console.log(jsonData);
      setGridData(jsonData);
    }
    fetchData();
  }, [gridData]);

  const handlePageClick = () => {
    setSelectedRow(-1);
    setSelectedCol(-1);
  };

  return (
    <div onClick={handlePageClick} className="flex flex-col items-center justify-center h-screen dark:bg-gray-800 dark:text-white relative">
      {selectedRow !== -1 && selectedCol !== -1 ? <SearchBar /> : null}
      {selectedRow !== -1 && selectedCol !== -1 ? <div className="absolute inset-0 bg-black opacity-50 z-20" /> : null}
      <Grid {...{ gridData, setSelectedRow, setSelectedCol }} />
    </div>
  );
}

export default App;
