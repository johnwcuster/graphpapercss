// Reviewed finite candidate data and build-time preference ordering.
export const pools=[
  [[-1,0,1,0],[-1,0,0,1],[0,0,0,0],[-1,1,0,0],[-1,-1,-1,3],[-2,0,2,0]],
  [[-1,1,0,1],[-1,0,2,0],[0,0,0,1],[-1,0,0,2],[-1,0,1,1],[-1,2,0,0],[-2,0,1,2]],
  [[0,1,0,1],[0,1,1,0],[0,0,1,1],[-1,-1,1,3]],
  [[-1,0,1,3],[1,0,2,0],[0,1,2,0],[-1,1,1,2],[-1,1,2,1]]
];
export const candidateSlots=Math.max(...pools.map(p=>p.length));
const spread=a=>Math.max(...a)-Math.min(...a);
const energy=a=>a.reduce((s,k)=>s+k*k,0);
export function candidates(n,policy='closest') {
  if(!Number.isSafeInteger(n)||n<4||!['closest','stronger'].includes(policy))throw Error('Invalid search input');
  const pool=[...pools[n%4]].sort((a,b)=>(policy==='closest'?1:-1)*(spread(a)-spread(b))||energy(a)-energy(b)||a.join(',').localeCompare(b.join(',')));
  while(pool.length<candidateSlots)pool.push(pool.at(-1));
  return pool.map(a=>a.map(k=>Math.floor(n/4)+k));
}
