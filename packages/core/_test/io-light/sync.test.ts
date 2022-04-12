export interface Calculator {
  readonly factor: number;
  readonly factorFun: () => number;
  readonly base: Sync<unknown, never, number>;
  readonly add: (x: number, y: number) => Sync<unknown, never, number>;
  readonly mul: (x: number, y: number) => Sync<unknown, never, number>;
  readonly gen: <A>(a: A) => Sync<unknown, never, A>;
}

export const Calculator = Tag<Calculator>();

export function LiveCalculator(): Calculator {
  return {
    factor: 2,
    factorFun: () => 3,
    base: Sync.succeed(1),
    add: (x: number, y: number) => Sync.succeed(x + y),
    mul: (x: number, y: number) => Sync.succeed(x * y),
    gen: <A>(a: A) => Sync.succeed(a)
  };
}

export function MockCalculator(): Calculator {
  return {
    factor: 0,
    factorFun: () => 0,
    add: () => Sync.succeed(0),
    mul: () => Sync.succeed(0),
    base: Sync.succeed(0),
    gen: (a) => Sync.succeed(a)
  };
}

export const { add, base, factor, mul } = Sync.deriveLifted(Calculator)(
  ["add", "mul"],
  ["base"],
  ["factor"]
);

export const { factorFun } = Sync.deriveAccess(Calculator)(["factorFun", "gen"]);

export const { gen } = Sync.deriveAccessSync(Calculator)(["gen"]);

const program = gen((_) => _(1))
  .zip(factorFun((_) => _()))
  .flatMap(({ tuple }) =>
    Sync.Do()
      .bind("b", () => base)
      .bind("f", () => factor)
      .bindValue("tuple", () => tuple)
  )
  .flatMap(({ b, f, tuple: [x, y] }) => add(b, f).map((k) => k + x + y))
  .flatMap((sum) => mul(sum, 3));

describe.concurrent("Sync", () => {
  describe.concurrent("effect", () => {
    it("should run a Sync program in a fiber", async () => {
      const effectProgram = Effect.suspend(() => program).provideService(Calculator)(
        LiveCalculator()
      );

      const result = await effectProgram.unsafeRunPromise();

      assert.strictEqual(result, 21);
    });
  });

  describe.concurrent("derivation", () => {
    it("should use derived access function", () => {
      const result = program.provideService(Calculator)(LiveCalculator()).run();

      assert.strictEqual(result, 21);
    });

    it("should use mock service", () => {
      const result = program.provideService(Calculator)(MockCalculator()).run();

      assert.strictEqual(result, 0);
    });
  });
});
