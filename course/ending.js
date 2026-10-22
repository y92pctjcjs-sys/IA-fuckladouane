// Reject the incomplete bucket before applying modulo. No modulo bias.
export function drawEnding(nextUint32 = () => {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0];
}) {
  const limit = Math.floor(0x100000000 / 30) * 30;
  let value;
  do {
    value = nextUint32();
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('uint32 required');
  } while (value >= limit);
  return value % 30 === 0 ? 'love' : 'escape';
}
