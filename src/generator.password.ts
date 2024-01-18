import { type ExtensionConfig } from './extensionConfig';

export class GeneratorPassword {
  randomLengthMin: number;
  randomLengthMax: number;

  constructor($extConfig: ExtensionConfig) {
    this.randomLengthMin = $extConfig.randomLengthMin;
    this.randomLengthMax = $extConfig.randomLengthMax;

    if (this.randomLengthMin >= this.randomLengthMax) {
      throw new Error('The "Random Length Min" parameter is greater than the "Random Length Max"!');
    }
  }

  lettersGenerate(): string {
    return this.passwordGenerator('letters');
  }

  lettersNumbersGenerate(): string {
    return this.passwordGenerator('letters-numbers');
  }

  allCharactersGenerate(): string {
    return this.passwordGenerator('all-generate');
  }

  randomNumber(): number {
    return Math.floor(Math.random() * (Math.floor(this.randomLengthMax) - Math.ceil(this.randomLengthMin) + 1) + Math.ceil(this.randomLengthMin));
  }

  private passwordGenerator(typeGenerate: string): string {
    const passwordLength = this.randomNumber();

    const letters = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ';
    const symbols = '[]{}()¿?-_.:,;><|/¡!^*+=@#$%&';
    const numeric = '1234567890';

    let characters = '';
    switch(typeGenerate) {
    case 'letters':
      characters = letters;
      break;
    case 'letters-numbers':
      characters = letters + numeric;
      break;
    case 'all-generate':
      characters = letters + numeric + symbols;
      break;
    }

    const charLength = characters.length;

    let password = '';
    let index = 0;
    while (index <= passwordLength) {
      let charIndex = Math.floor(Math.random() * (0 - charLength + 1) + charLength);
      password += characters.charAt(charIndex);
      ++index;
    }

    return password;
  }
}
