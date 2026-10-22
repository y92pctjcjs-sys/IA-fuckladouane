export const SAVE_KEY = 'fld.course.v1';
const empty = () => ({version: 1, wins: 0, runs: 0, bestTime: null, bestScore: 0, love: false});
export function createSave(storage) {
  let data = empty();
  try {
    const read = JSON.parse(storage?.getItem(SAVE_KEY) || 'null');
    if (read?.version === 1) {
      for (const key of ['wins', 'runs', 'bestScore']) if (Number.isFinite(read[key]) && read[key] >= 0) data[key] = read[key];
      if (Number.isFinite(read.bestTime) && read.bestTime > 0) data.bestTime = read.bestTime;
      data.love = read.love === true;
    }
  } catch { /* Private browsing and blocked storage retain in-memory results. */ }
  const recorded = new WeakSet();
  return {
    get data() { return {...data}; },
    record(result) {
      if (!result || recorded.has(result)) return {...data};
      recorded.add(result);
      data.runs++;
      if (result.won) {
        data.wins++;
        data.bestTime = data.bestTime === null ? result.time : Math.min(data.bestTime, result.time);
        data.bestScore = Math.max(data.bestScore, result.score);
        data.love ||= result.ending === 'love';
      }
      try { storage?.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* Session remains playable. */ }
      return {...data};
    }
  };
}
