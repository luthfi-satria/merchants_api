export function CreateRandomNumber(pjg: number): string {
  if (pjg == 4) {
    const key: number = Math.floor(1000 + Math.random() * 9000);
    return key + '';
  }
  const key: number = Math.floor(100000 + Math.random() * 900000);
  return key + '';
}
