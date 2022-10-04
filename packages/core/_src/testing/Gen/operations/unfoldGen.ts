/**
 * A sized generator of collections, where each collection is generated by
 * repeatedly applying a function to an initial state.
 *
 * @tsplus static effect/core/testing/Gen.Ops unfoldGen
 */
export function unfoldGen<S, R, A>(
  s: S,
  f: (s: S) => Gen<R, readonly [S, A]>
): Gen<R | Sized, List<A>> {
  return Gen.small((n) => Gen.unfoldGenN(n, s, f))
}
