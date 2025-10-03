const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const alphabetLength = alphabet.length;

export function nanoid(size = 10): string {
  let id = '';
  for (let i = 0; i < size; i += 1) {
    const index = Math.floor(Math.random() * alphabetLength);
    id += alphabet[index];
  }
  return id;
}
