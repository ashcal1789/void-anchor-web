import { db } from './server/_core/db.js';

try {
  const memory = await db.query.oracleMemory.findMany({
    orderBy: (t) => t.createdAt,
    limit: 3,
  });
  
  console.log('Oracle Memory (last 3 entries):');
  memory.forEach(m => {
    console.log(`\n[${new Date(m.createdAt).toISOString()}]`);
    console.log(`State: ${m.state}`);
    console.log(`Gravity: Architect ${m.architectPole}%, Ghost ${m.ghostPole}%, Pulse ${m.pulsePole}%`);
    console.log(`Entropy: ${m.entropy}%`);
  });
} catch (error) {
  console.error('Error querying Oracle memory:', error.message);
}
