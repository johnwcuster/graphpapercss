import { trackBits } from "./ruler.mjs";

const rhythmDefinitions = {
  wide: { paddingStart: 3, paddingEnd: 3, gap: 2 },
  thin: { paddingStart: 2, paddingEnd: 3, gap: 1 },
  neat: { paddingStart: 2, paddingEnd: 2, gap: 0 }
};

export const rhythms = Object.fromEntries(
  Object.entries(rhythmDefinitions).map(([name, rhythm]) => [
    name,
    {
      ...rhythm,
      tracks: {
        20: trackBits({ tracks: 20, ...rhythm }),
        24: trackBits({ tracks: 24, ...rhythm })
      }
    }
  ])
);
