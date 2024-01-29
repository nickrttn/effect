import type { ParseOptions } from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import * as S from "@effect/schema/Schema"
import { Bench } from "tinybench"
import { z } from "zod"

/*
┌─────────┬──────────────────────────────────────────┬───────────┬───────────────────┬──────────┬─────────┐
│ (index) │                Task Name                 │  ops/sec  │ Average Time (ns) │  Margin  │ Samples │
├─────────┼──────────────────────────────────────────┼───────────┼───────────────────┼──────────┼─────────┤
│    0    │   'Schema.decodeUnknownEither (good)'    │ '138,053' │ 7243.554507198951 │ '±0.85%' │ 138054  │
│    1    │ 'ParseResult.decodeUnknownEither (good)' │ '128,506' │ 7781.701724800714 │ '±2.51%' │ 128507  │
│    2    │               'zod (good)'               │ '188,773' │ 5297.342979977194 │ '±7.13%' │ 188792  │
│    3    │    'Schema.decodeUnknownEither (bad)'    │ '34,880'  │ 28669.19968011391 │ '±0.46%' │  34881  │
│    4    │ 'ParseResult.decodeUnknownEither (bad)'  │ '129,795' │ 7704.451490526424 │ '±0.53%' │ 129796  │
│    5    │               'zod (bad)'                │ '52,210'  │ 19153.05420333659 │ '±6.88%' │  52211  │
└─────────┴──────────────────────────────────────────┴───────────┴───────────────────┴──────────┴─────────┘
*/

const bench = new Bench({ time: 1000 })

const Vector = S.tuple(S.number, S.number, S.number)
const VectorZod = z.tuple([z.number(), z.number(), z.number()])

const Asteroid = S.struct({
  type: S.literal("asteroid"),
  location: Vector,
  mass: S.number
})
const AsteroidZod = z.object({
  type: z.literal("asteroid"),
  location: VectorZod,
  mass: z.number()
})

const Planet = S.struct({
  type: S.literal("planet"),
  location: Vector,
  mass: S.number,
  population: S.number,
  habitable: S.boolean
})
const PlanetZod = z.object({
  type: z.literal("planet"),
  location: VectorZod,
  mass: z.number(),
  population: z.number(),
  habitable: z.boolean()
})

const Rank = S.union(
  S.literal("captain"),
  S.literal("first mate"),
  S.literal("officer"),
  S.literal("ensign")
)
const RankZod = z.union([
  z.literal("captain"),
  z.literal("first mate"),
  z.literal("officer"),
  z.literal("ensign")
])

const CrewMember = S.struct({
  name: S.string,
  age: S.number,
  rank: Rank,
  home: Planet
})
const CrewMemberZod = z.object({
  name: z.string(),
  age: z.number(),
  rank: RankZod,
  home: PlanetZod
})

const Ship = S.struct({
  type: S.literal("ship"),
  location: Vector,
  mass: S.number,
  name: S.string,
  crew: S.array(CrewMember)
})
const ShipZod = z.object({
  type: z.literal("ship"),
  location: VectorZod,
  mass: z.number(),
  name: z.string(),
  crew: z.array(CrewMemberZod)
})

export const schema = S.union(Asteroid, Planet, Ship)
export const schemaZod = z.discriminatedUnion("type", [AsteroidZod, PlanetZod, ShipZod])

const good = {
  type: "ship",
  location: [1, 2, 3],
  mass: 4,
  name: "foo",
  crew: [
    {
      name: "bar",
      age: 44,
      rank: "captain",
      home: {
        type: "planet",
        location: [5, 6, 7],
        mass: 8,
        population: 1000,
        habitable: true
      }
    }
  ]
}

const bad = {
  type: "ship",
  location: [1, 2, "a"],
  mass: 4,
  name: "foo",
  crew: [
    {
      name: "bar",
      age: 44,
      rank: "captain",
      home: {
        type: "planet",
        location: [5, 6, 7],
        mass: 8,
        population: "a",
        habitable: true
      }
    }
  ]
}

export const schemadecodeUnknownEither = S.decodeUnknownEither(schema)
const parseResultdecodeUnknownEither = ParseResult.decodeUnknownEither(schema)
const options: ParseOptions = { errors: "all" }

bench
  .add("Schema.decodeUnknownEither (good)", function() {
    schemadecodeUnknownEither(good, options)
  })
  .add("ParseResult.decodeUnknownEither (good)", function() {
    parseResultdecodeUnknownEither(good, options)
  })
  .add("zod (good)", function() {
    schemaZod.safeParse(good)
  })
  .add("Schema.decodeUnknownEither (bad)", function() {
    schemadecodeUnknownEither(bad, options)
  })
  .add("ParseResult.decodeUnknownEither (bad)", function() {
    parseResultdecodeUnknownEither(bad, options)
  })
  .add("zod (bad)", function() {
    schemaZod.safeParse(bad)
  })

await bench.run()

console.table(bench.table())
