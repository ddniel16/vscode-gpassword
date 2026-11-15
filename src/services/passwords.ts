import crypto from "node:crypto";

export const AMBIGUOUS_CHARACTERS = "0O1lI|";

interface PasswordOptions {
  numbers: boolean;
  symbols: boolean;
  uppercase: boolean;
  customChars: string;
  length: number;
  excludeAmbiguous: boolean;
}

export function filterAmbiguousCharacters(characters: string): string {
  return [...characters].filter((character) => !AMBIGUOUS_CHARACTERS.includes(character)).join("");
}

export class PasswordsGenerator {
  // RNG
  private randomIntSecure(maxExclusivo: number): number {
    return crypto.randomInt(0, maxExclusivo);
  }

  /**
   * Returns a new shuffled array, leaving the original array unmodified.
   */
  private shuffle(array: string[]): string[] {
    const arr = array.slice(); // create a copy
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.randomIntSecure(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public generatePassword(settings: PasswordOptions): string {
    const length = settings.length || 12;
    if (length < 4) {
      throw new Error("La longitud mínima recomendada es 4");
    }

    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "[]{}()¿?-_.:,;><|/¡!^*+=@#$%&~`'\"";
    const custom = settings.customChars || "";
    const filterCharacters = settings.excludeAmbiguous ? filterAmbiguousCharacters : (characters: string) => characters;

    let pool = filterCharacters(lower);
    const setsRequeridos = [pool];

    if (settings.uppercase) {
      const characterSet = filterCharacters(upper);
      pool += characterSet;
      setsRequeridos.push(characterSet);
    }
    if (settings.numbers) {
      const characterSet = filterCharacters(numbers);
      pool += characterSet;
      setsRequeridos.push(characterSet);
    }
    if (settings.symbols) {
      const characterSet = filterCharacters(symbols);
      pool += characterSet;
      setsRequeridos.push(characterSet);
    }
    if (custom.length > 0) {
      const characterSet = filterCharacters(custom);
      pool += characterSet;
      setsRequeridos.push(characterSet);
    }

    if (setsRequeridos.some((characterSet) => characterSet.length === 0)) {
      throw new Error("No characters remain in a required character set after ambiguous characters are excluded.");
    }

    let chars = [];
    for (const set of setsRequeridos) {
      chars.push(set[this.randomIntSecure(set.length)]);
    }

    while (chars.length < length) {
      chars.push(pool[this.randomIntSecure(pool.length)]);
    }
    chars = this.shuffle(chars);

    return chars.join("");
  }
}
