export async function batchReadFromDB<T>(
  repository: any,
  batchSize: number,
  orderingFields: string[],
  relations: string[],
  where: { [key: string]: any } = {}
): Promise<T[]> {
  const items: T[] = [];
  const totalCount = await repository.count();
  let skip = 0;

  do {
    const result = await repository.find({
      skip,
      take: batchSize,
      relations,
      where,
      order: orderingFields.reduce((acc: { [key: string]: "ASC" | "DESC" }, field) => {
        acc[field] = "ASC";
        return acc;
      }, {}),
    });

    items.push(...result);
    skip += result.length;
  } while (items.length < totalCount);

  console.log(`total fetched items: ${items.length}`);

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
