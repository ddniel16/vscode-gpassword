interface PasswordOptions {
  numbers: boolean;
  symbols: boolean;
  uppercase: boolean;
  customChars: string;
  length: number;
}

export class PasswordsGenerator {
  generatePassword(options: PasswordOptions): string {
    const { numbers, symbols, uppercase, customChars, length } = options;

    const numChars = '0123456789';
    const symbolChars = "/\"'`!¡~@#$%^&*()_+-=[]{}|;:,.<>¿?€";
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';

    let chars = lowerChars;

    if (numbers) chars += numChars;
    if (symbols) chars += symbolChars;
    if (uppercase) chars += upperChars;
    if (customChars && typeof customChars === 'string') chars += customChars;

    const lengthChars = typeof length === 'number' && length >= 10 ? length : 10;

    let password = '';
    for (let i = 0; i < lengthChars; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }
}
