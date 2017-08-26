var b = require('@timelaps/batterie');
var Trie = require('.');
var now = require('@timelaps/polyfill/performance/now');
var reduce = require('@timelaps/array/reduce');
b.describe('Trie', function () {
    b.expect(Trie).toBeFunction();
    b.it('creates instances of Leafs', function (t) {
        var trie = Trie([]);
        t.expect(trie).toBeInstance(Trie.constructor);
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
                var array = new Array(1000000);
                for (var i = 0; i < array.length; i++) {
                    array[i] = i;
                }
                var trie = Trie(array);
                var trieSum = trie.reduce(sum, 0);
                var arraySum = array.reduce(sum, 0);
                t.expect(trie.reduce(sum, 0)).toBe(array.reduce(sum, 0));

                function sum(memo, item) {
                    return memo + item;
                }
            });
        });
    });
});