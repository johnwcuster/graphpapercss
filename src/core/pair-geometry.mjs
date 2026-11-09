const gcd=(a,b)=>b?gcd(b,a%b):a;
export function pairExactRequest(exact){
 if(!Array.isArray(exact))return null;
 if(exact.length===2)return exact;
 if(exact.length===3&&exact[1]===0)return [exact[0],exact[2]];
 return null;
}
export function pairExactCountsEligible(count,exact){
 const pair=pairExactRequest(exact);
 return Number.isSafeInteger(count)&&count>=2&&pair!==null&&pair.every(n=>Number.isSafeInteger(n)&&n>0)&&pair[0]+pair[1]===count&&Math.abs(pair[0]-pair[1])<=4&&gcd(...pair)===1;
}
