import { Grid } from "../../../common/src/interfaces";

const Summary: React.FC<Grid> = ({ actors, credits, answers }) => {
  const acrossActors = actors.slice(0, actors.length / 2);
  const downActors = actors.slice(actors.length / 2);

  function getAnswersForPair(actor1Id: number, actor2Id: number): Set<string> {
    const answerNames: Set<string> = new Set();
    const actor1Answers = answers[actor1Id];
    const actor2Answers = answers[actor2Id];

    for (const actor1Answer of actor1Answers) {
      for (const actor2Answer of actor2Answers) {
        if (actor1Answer.type === actor2Answer.type && actor1Answer.id === actor2Answer.id) {
          // Look up this credit's title in the credits array
          const answer = credits.find((credit) => credit.id === actor1Answer.id);
          if (answer) {
            answerNames.add(answer.name);
          }
        }
      }
    }

    return answerNames;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 overflow-auto max-w-full max-h-full">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg max-w-full max-h-full overflow-auto">
        <div className="grid grid-cols-3 gap-4 max-w-full max-h-full overflow-auto">
          {downActors.map((downActor) => (
            acrossActors.map((acrossActor) => (
              <div key={`${acrossActor.id}-${downActor.id}`} className="border p-2 max-h-64 overflow-auto">
                <p className="font-bold">{`${acrossActor.name} & ${downActor.name}:`}</p>
                {Array.from(getAnswersForPair(acrossActor.id, downActor.id)).map((answer, answerIndex) => (
                  <p key={answerIndex} className="pl-4">{`• ${answer}`}</p>
                ))}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}

export default Summary;
