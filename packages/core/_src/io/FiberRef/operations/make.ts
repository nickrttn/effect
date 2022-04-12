/**
 * Creates a new `FiberRef` with given initial value.
 *
 * @tsplus static ets/FiberRef/Ops make
 */
export function make<A>(
  initial: A,
  fork: (a: A) => A = identity,
  join: (left: A, right: A) => A = (_, a) => a,
  __tsplusTrace?: string
): Effect<Has<Scope>, never, FiberRef<A>> {
  return FiberRef.makeWith(
    FiberRef.unsafeMake(initial, fork, join)
  );
}
