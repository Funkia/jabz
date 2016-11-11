import "mocha";
import {assert} from "chai";

import {Applicative, ApplicativeDictionary} from "../src/applicative";
import {Monad, monad, arrayFlatten, go, fgo, flatten} from "../src/monad";
import {Maybe, just, nothing} from "../src/maybe";
import {Either} from "../src/either";
import {testFunctor} from "./functor";
import {testApplicative} from "./applicative";
import {Traversable, traversable, traverse, sequence} from "../src/traversable";
import {testFoldable} from "./foldable";

export function testTraversable(list: <A>(l: A[]) => Traversable<A>) {
  it("can sequence", () => {
    assert.deepEqual(
      just(list([1, 2, 3])),
      sequence(Maybe, list([just(1), just(2), just(3)]))
    );
  });
  it("can traverse", () => {
    assert.deepEqual(
      just(list([1, 2, 3])),
      traverse(Maybe, just, list([1, 2, 3]))
    );    
  });
}

describe("Traversable", () => {
  describe("deriving with `traverse`", () => {
    @traversable
    class List<A> implements Traversable<A> {
      constructor(private list: A[]) {};
      traverse<B>(
        a: ApplicativeDictionary,
        f: (a: A) => Applicative<B>
      ): Applicative<List<B>> {
        return traverse(a, f, this.list).map((a) => new List(a));
      }
      sequence: <A>(a: ApplicativeDictionary, t: Traversable<Applicative<A>>) => Applicative<Traversable<A>>;
      map: <B>(f: (a: A) => B) => List<B>;
      mapTo: <B>(b: B) => List<B>;
      foldr: <B>(f: (a: A, b: B) => B, acc: B) => B;
      shortFoldr: <B>(f: (a: A, b: B) => Either<B, B>, acc: B) => B;
      size: () => number;
      maximum: () => number;
      minimum: () => number;
      sum: () => number;
    }
    const list = <A>(as: A[]) => new List(as);
    testFunctor("List", new List([1, 2, 3]));
    testFoldable(list);
    testTraversable(list);
  });
  describe("deriving with `sequence`", () => {
    @traversable
    class List<A> implements Traversable<A> {
      constructor(private list: A[]) {};
      traverse: <B>(a: ApplicativeDictionary, f: (a: A) => Applicative<B>) => Applicative<List<B>>;
      sequence<A>(
        a: ApplicativeDictionary,
        t: List<Applicative<A>>
      ): Applicative<Traversable<A>> {
        return sequence(a, t.list).map((a) => new List(a));
      }
      map<B>(f: (a: A) => B): List<B> {
        return new List(this.list.map(f));
      }
      mapTo: <B>(b: B) => List<B>;
      foldr: <B>(f: (a: A, b: B) => B, acc: B) => B;
      shortFoldr: <B>(f: (a: A, b: B) => Either<B, B>, acc: B) => B;
      size: () => number;
      maximum: () => number;
      minimum: () => number;
      sum: () => number;
    }
    const list = <A>(as: A[]) => new List(as);
    testFunctor("List", new List([1, 2, 3]));
    testTraversable(list);
  });
  describe("incorrect deriviations", () => {
    it("cannot derive with only `sequence`", () => {
      assert.throws(() => {
        @traversable
        class List<A> {
          constructor(private list: A[]) {};          
          sequence<A>(
            a: ApplicativeDictionary,
            t: List<Applicative<A>>
          ): Applicative<List<A>> {
            return sequence(a, t.list).map((a) => new List(a));
          }
        }
      });
    });
  });
});