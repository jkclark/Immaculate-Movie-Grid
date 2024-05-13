// import React from 'react';
import { useEffect } from 'react';
import Grid from './components/Grid';
import { getS3Object } from './s3';

function App() {
  useEffect(() => {
    async function fetchData() {
      const jsonData = await getS3Object("immaculate-movie-grid-daily-grids", "test-grid.json");
      console.log("Grid data:");
      console.log(jsonData);
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto flex items-center justify-center h-screen">
      <Grid />
    </div>
  );
}

export default App;
