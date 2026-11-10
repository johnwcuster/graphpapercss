// Build-time CSS expression helpers. They emit no properties or selectors.
export const variable=n=>`var(--_gp-${n})`;
export const equal=(a,b)=>`max(0,calc(1 - abs(${a} - ${b})))`;
export const sum=values=>values.join(' + ')||'0';
export const boundCount=(input,total)=>`clamp(0,${input},${total})`;
export const positiveCounts=values=>`calc(${values.map(value=>`clamp(0,${value},1)`).join(' * ')})`;
