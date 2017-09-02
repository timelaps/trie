var b = require('@timelaps/batterie');
var Trie = require('.');
var now = require('@timelaps/polyfill/performance/now')(global);
var reduce = require('@timelaps/array/reduce');
b.describe('Trie', function () {
    b.expect(Trie).toBeFunction();
    b.it('creates instances of Leafs', function (t) {
        var trie = Trie([]);
        t.expect(trie).toBeInstance(Trie.constructor);
    });
    b.describe('structure', function () {
        b.it('has a value property that points to an array', function (t) {
            var trie = Trie();
            t.expect(trie.value).toBeArray();
        });
        // b.it('the value array always have a length that matches the exposed MAX', function (t) {
        //     var trie = Trie([2, 3, 4]);
        //     t.expect(trie.value.length).toBe(Trie.MAX);
        // });
        b.it('will have the correct sized elements even in deep structures', function (t) {
            var trie = Trie(make(100));
            var sub = trie.access(3);
            t.expect(sub.length).toBe(100 % Trie.MAX);
        });
    });
    b.describe('methods', function () {
        b.describe('get', function () {
            b.it('allows you to access items', function (t) {
                var sparce = new Array(1000000);
                sparce[450] = 50;
                var trie = Trie(sparce);
                t.expect(trie.depth).toBe(3);
                t.expect(trie.length).toBe(1000000);
                t.expect(trie.get(450)).toBe(50);
            }, 3);
            b.it('can reach outside of it\'s index and will always get back undefined', function (t) {
                var trie = Trie();
                t.expect(trie.get(1)).toBeUndefined();
            });
            b.it('even if it has items in other indeces', function (t) {
                var trie = Trie([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                t.expect(trie.get(1000000)).toBeUndefined();
            });
        });
        b.describe('set', function () {
            b.it('allows you to set new items', function (t) {
                var sparce = new Array(100);
                var trie = Trie(sparce);
                var trie2 = trie.set(88, 'foo');
                t.expect(trie).toBeInstance(Trie.constructor);
                t.expect(trie2).toBeInstance(Trie.constructor);
                t.expect(trie).notToBe(trie2);
                t.expect(trie2.get(88)).toBe('foo');
            }, 4);
            b.it('will extend the trie to accommodate out of range indeces', function (t) {
                var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                var trie = Trie(array);
                var trie2 = trie.set(30, 'here');
                t.expect(trie).notToBe(trie2);
                t.expect(trie.get(30)).toBeUndefined();
                t.expect(trie2.get(30)).toBe('here');
            }, 3);
            b.it('will extend the trie to accommodate way out of range indeces', function (t) {
                var array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                var trie = Trie(array);
                var trie2 = trie.set(1000000, 'here');
                t.expect(trie).notToBe(trie2);
                t.expect(trie.get(1000000)).toBeUndefined();
                t.expect(trie2.get(1000000)).toBe('here');
            }, 3);
        });
        b.describe('fromTo', function () {
            b.it('allows you to traverse through the list', function (t) {
                var array = [9, 8, 7, 6, 5, 4, 3, 2, 1];
                var trie = Trie(array);
                trie.fromTo(function (memo, value, index) {
                    t.expect(value).toBe(array[index]);
                });
            }, 9);
            b.it('will iterate through large structures', function (t) {
                var array = make(1000000);
                var trie = Trie(array);
                var trieSum = trie.reduce(sum, 0);
                var arraySum = array.reduce(sum, 0);
                t.expect(trie.reduce(sum, 0)).toBe(array.reduce(sum, 0));

                function sum(memo, item) {
                    return memo + item;
                }
            });
        });
        b.describe('push', function () {
            b.it('adds an element to the end of the trie', function (t) {
                var array = make(31);
                var sparseTrie = Trie(array);
                var fullTrie = sparseTrie.push(31);
                t.expect(fullTrie).notToBe(sparseTrie);
                t.expect(fullTrie.length).toBe(32);
                t.expect(fullTrie.get(31)).toBe(31);
                t.expect(sparseTrie.get(31)).toBeUndefined();
            }, 4);
            b.it('can add elements to a deep trie', function (t) {
                var nextIndex = 32 * 4;
                var array = make(nextIndex);
                var trie = Trie(array);
                var moreTrie = trie.push(nextIndex);
                t.expect(moreTrie.get(nextIndex)).toBe(nextIndex);
                t.expect(moreTrie.length).toBe(nextIndex + 1);
                t.expect(trie.length).toBe(nextIndex);
            }, 3);
            b.it('can bunch elements', function (t) {
                var trie = Trie(make(32));
                var moreTrie = trie.push(32);
                t.expect(trie).notToBe(moreTrie);
                t.expect(trie.get(32)).toBeUndefined();
                t.expect(moreTrie.get(32)).toBe(32);
            }, 3);
            b.it('doesn\'t leave extra undefined in the array', function (t) {
                var nextIndex = 32 * 32;
                var trie = pushTo(Trie(), nextIndex);
                var moreTrie = trie.push(nextIndex);
                t.expect(moreTrie.get(nextIndex)).toBe(nextIndex);
                t.expect(trie).notToBe(moreTrie);
                t.expect(trie.get(nextIndex)).toBeUndefined();
            }, 3);
        });
        b.describe('concat', function () {
            b.it('can add many elements to the end of a trie', function (t) {
                var trie = Trie(make(10));
                var moreTrie = trie.concat([
                    10, 11, 12, 13, 14
                ]);
                t.expect(moreTrie).notToBe(trie);
                t.expect(moreTrie.get(11)).toBe(11);
                t.expect(trie.get(11)).toBeUndefined();
            }, 3);
            b.it('can add elements to a sparce and deep trie', function (t) {
                var nextIndex = 32 * 4.5;
                var thirtyTwoFive = 32 * 6.5;
                var array = make(nextIndex);
                var trie = Trie(array);
                var set = make(thirtyTwoFive).slice(nextIndex);
                var moreTrie = trie.concat(set);
                t.expect(moreTrie.get(thirtyTwoFive - 1)).toBe(thirtyTwoFive - 1);
                t.expect(moreTrie.length).toBe(thirtyTwoFive);
                t.expect(trie.length).toBe(nextIndex);
            }, 3);
        });
    });
});
benchmarks();

function pushTo(trie, limit) {
    var list = trie;
    for (var i = 0; i < limit; i++) {
        list = list.push(i);
    }
    return list;
}

function benchmarks() {
    var list = Trie();
    var onemillion = 1000000;
    benchmark(function () {
        list = pushTo(list, onemillion);
    });
    benchmark(function () {
        var array = [];
        for (var i = 0; i < onemillion; i++) {
            array.push(i);
        }
    });
    benchmark(function () {
        b.log(list.reduce(function (memo, next) {
            return memo + next;
        }, 0));
    });
}

function benchmark(fn) {
    var start = now();
    fn();
    b.log((now() - start) + 'ms');
}

function capacityByDepth(depth) {
    return Math.pow(32, depth + 1);
}

function make(capacity) {
    var empty = new Array(capacity);
    for (var i = 0; i < capacity; i++) {
        empty[i] = i;
    }
    return empty;
}