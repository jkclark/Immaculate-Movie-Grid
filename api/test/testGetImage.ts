import { handler as getImageHandler } from '../src/getImage';

async function main() {
    const image = await getImageHandler({ pathParameters: { actorId: "4495" } }, null, null);
    console.log(image);
}

main()
