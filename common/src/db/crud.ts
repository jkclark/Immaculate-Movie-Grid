import { FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";

export async function batchReadFromDB<T extends ObjectLiteral>(
  repository: Repository<T>,
  batchSize: number,
  order: FindOptionsOrder<T>,
  relations: string[],
  where: FindOptionsWhere<T>
): Promise<T[]> {
  const items: T[] = [];
  let skip = 0;

  while (true) {
    const result = await repository.find({
      skip,
      take: batchSize,
      relations,
      order,
      where,
    });

    items.push(...result);
    skip += batchSize;

    // Break the loop if fewer items were fetched than the batch size
    if (result.length < batchSize) {
      break;
    }
  }

  console.log(`Fetched ${items.length.toString().padEnd(7)} ${repository.metadata.name}'s`);

  return items;
}

export async function batchWriteToDB<T>(
  items: T[],
  repository: any,
  batchSize: number,
  conflictPaths: string[]
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    if (conflictPaths.length === 0) {
      await repository.save(batch);
    } else {
      await repository.upsert(batch, { conflictPaths });
    }
  }

  console.log(`Wrote ${items.length} items to the database`);
}
