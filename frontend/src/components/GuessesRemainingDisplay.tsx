const GuessesRemainingDisplay = (guessesRemaining: number): JSX.Element => {
  return (
    <div className="cursor-default text-center">
      <p className="text-7xl hover:cursor-default">{guessesRemaining}</p>
      <p className="text-xl">guesses left</p>
    </div>
  );
};

export default GuessesRemainingDisplay;
