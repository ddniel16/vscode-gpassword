export class EntropyCalculator {
  private calculateShannonEntropy(password: string): number {
    const n = password.length;
    if (!n) {
      return 0;
    }

    const freq: { [key: string]: number } = {};
    for (const c of password) {
      freq[c] = (freq[c] || 0) + 1;
    }

    let h = 0;
    for (const c in freq) {
      const p = freq[c] / n;
      h -= p * Math.log2(p);
    }
    return h * n;
  }

  private calculateTheoreticalEntropy(length: number, poolSize: number): number {
    if (!length || !poolSize) {
      return 0;
    }

    return length * Math.log2(poolSize);
  }

  private classify(bits: number): string {
    if (bits < 40) {
      return "very-weak";
    }
    if (bits < 60) {
      return "weak";
    }
    if (bits < 80) {
      return "medium";
    }
    if (bits < 100) {
      return "strong";
    }
    return "very-strong";
  }

  private detectCategories(
    password: string,
    opts: { uppercase?: boolean; numbers?: boolean; symbols?: boolean },
    custom: string
  ): number {
    let presentes = 0;
    const symbols = "[]{}()¿?-_.:,;><|/¡!^*+=@#$%&~`'\"";
    const regexSymbols = opts.symbols ? new RegExp("[" + symbols.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "]") : null;

    if (/[a-z]/.test(password)) {
      presentes++;
    }

    if (opts.uppercase && /[A-Z]/.test(password)) {
      presentes++;
    }

    if (opts.numbers && /\d/.test(password)) {
      presentes++;
    }

    if (opts.symbols && regexSymbols && regexSymbols.test(password)) {
      presentes++;
    }

    if (custom && new RegExp("[" + custom.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "]").test(password)) {
      presentes++;
    }

    return presentes;
  }

  public calculateDetailedEntropy(
    password: string,
    opts: { uppercase?: boolean; numbers?: boolean; symbols?: boolean; custom?: string }
  ): {
    theoreticalBits: number;
    shannonBits: number;
    score: string;
  } {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "[]{}()¿?-_.:,;><|/¡!^*+=@#$%&~`'\"";
    const custom = opts.custom || "";

    let poolSize = lower.length; // base

    if (opts.uppercase) {
      poolSize += upper.length;
    }
    if (opts.numbers) {
      poolSize += numbers.length;
    }
    if (opts.symbols) {
      poolSize += symbols.length;
    }
    if (custom) {
      poolSize += custom.length;
    }

    const theoreticalBits = this.calculateTheoreticalEntropy(password.length, poolSize);
    const shannonBits = this.calculateShannonEntropy(password);

    const expected = 1 + (opts.uppercase ? 1 : 0) + (opts.numbers ? 1 : 0) + (opts.symbols ? 1 : 0) + (custom ? 1 : 0);
    const detectedCategories = this.detectCategories(password, opts, custom);
    const ratio = detectedCategories / expected;
    const penalty = ratio < 1 ? (1 - ratio) * 0.25 : 0;
    const adjustedBits = theoreticalBits * (1 - penalty);
    const score = this.classify(adjustedBits);

    return {
      theoreticalBits,
      shannonBits,
      score,
    };
  }
}
