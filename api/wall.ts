// Vercel Function (Node.js runtime, Web Request/Response signature).
// Needs an Upstash Redis database connected to the project — see README.
import { handleWall, storeFromEnv } from '../server/wall.js';

const store = storeFromEnv(process.env);
const handler = (req: Request) => handleWall(req, store, process.env.WALL_ADMIN_TOKEN);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
