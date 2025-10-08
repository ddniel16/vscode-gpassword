const crypto = require('crypto');

interface PasswordOptions {
  numbers: boolean;
  symbols: boolean;
  uppercase: boolean;
  customChars: string;
  length: number;
}

export class PasswordsGenerator {
  // RNG
  private randomIntSecure(maxExclusivo: number): number {
    return crypto.randomInt(0, maxExclusivo);
  }

  /**
   * Returns a new shuffled array, leaving the original array unmodified.
   */
  private shuffle(array: any[]): any[] {
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
      throw new Error('La longitud mínima recomendada es 4');
    }

    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = "[]{}()¿?-_.:,;><|/¡!^*+=@#$%&~`'\"";
    const custom = settings.customChars || '';

    let pool = lower;
    const setsRequeridos = [lower];

    if (settings.uppercase) {
      pool += upper; setsRequeridos.push(upper);
    }
    if (settings.numbers) {
      pool += numbers; setsRequeridos.push(numbers);
    }
    if (settings.symbols) {
      pool += symbols; setsRequeridos.push(symbols);
    }
    if (custom) {
      pool += custom; setsRequeridos.push(custom);
    }

    let chars = [];
    for (const set of setsRequeridos) {
      chars.push(set[this.randomIntSecure(set.length)]);
    }

    while (chars.length < length) {
      chars.push(pool[this.randomIntSecure(pool.length)]);
    }
    chars = this.shuffle(chars);

    return chars.join('');
  }
}
