module.exports = TrieMaker;
TrieMaker.constructor = Trie;
var u;
var MAX = 32;
var fromTo = require('@timelaps/n/from/to');
var isUndefined = require('@timelaps/is/undefined');
var assign = require('@timelaps/object/assign');
var create = require('@timelaps/object/create');
var reduce = require('@timelaps/array/reduce');
var isArray = require('@timelaps/is/array');
var isNumber = require('@timelaps/is/number');
var clamp = require('@timelaps/number/clamp');
var isString = require('@timelaps/is/string');
Trie.prototype = {
    fromTo: function (fn, memo, start, end, blockSize) {
        var length = this.length;
        return deepRead(fromTo, this.value, fn, memo, start || 0, end || length, length, this.depth);
    },
    reduce: function (fn, memo) {
        return this.fromTo(fn, memo);
    },
    get: function (index) {
        return index < this.length ? get(this, this.toIndexPath(index)) : u;
    },
    ofMutable: function (fn, memo) {
        var mutated, trie = this,
            readable = trie.value;
        return fn(trie, readable, mutable) || trie;

        function mutable() {
            // only make it once
            return mutated || (mutated = readable.slice(0));
        }
    },
    set: function (index, item) {
        var indexPath = this.toIndexPath(index);
        var method = index < this.capacity() ? setWithinCapacity : setOutsideOfCapacity;
        return method(this, indexPath, item);
    },
    toIndexPath: function (index) {
        return toIndexPath(index, this.depth);
    },
    capacity: function () {
        return computeCapacity(this.depth);
    },
    subtrie: function () {
        return new Trie({
            length: 0,
            depth: this.depth - 1,
            value: appropriatelySized()
        });
    },
    bunch: function (options) {
        var list = appropriatelySized();
        list[0] = this;
        return new Trie({
            length: this.length,
            depth: this.depth + 1,
            value: list
        });
    }
};

function TrieMaker(original_) {
    var original = original_ || [];
    var length = original.length;
    var depth = computeDepth(length);
    return churn(original, 0, length, length, depth);
}

function base32ToIndex(binary) {
    return parseInt(binary, MAX);
}

function nextChunk(binary) {
    return binary.slice(1);
}

function toBase32(number) {
    return parseInt(number).toString(MAX);
}

function keepChurning(original, inclusiveMin, exclusiveMax, length, depth) {
    var blockSize = Math.pow(MAX, depth);
    return fromTo(function (index, memo) {
        var idx = (index / blockSize) % MAX;
        memo[idx] = churn(original, index, index + blockSize, length, depth - 1);
        return memo;
    }, appropriatelySized(), inclusiveMin, clamp(exclusiveMax, 0, length) - 1, blockSize);
}

function slice(original, inclusiveMin, exclusiveMax) {
    return original.slice(inclusiveMin, exclusiveMax);
}

function churn(original, inclusiveMin, exclusiveMax, length, depth) {
    var next;
    if (exclusiveMax - inclusiveMin > MAX) {
        next = keepChurning(original, inclusiveMin, exclusiveMax, length, depth);
    } else {
        next = slice(original, inclusiveMin, exclusiveMax);
    }
    return new Trie({
        length: exclusiveMax - inclusiveMin,
        depth: depth,
        value: next
    });
}

function keepDeepReading(fromTo, structure, fn, memo, inclusiveMin, exclusiveMax, length, depth) {
    var blockSize = Math.pow(MAX, depth);
    return fromTo(function (index, memo) {
        var idx = (index / blockSize) % MAX;
        var trie = structure[idx];
        if (!trie) {
            return memo;
        }
        return deepRead(fromTo, trie.value, fn, memo, index, index + blockSize, length, depth - 1);
    }, memo, inclusiveMin, clamp(exclusiveMax, 0, length) - 1, blockSize);
}

function largerThanBlock(number) {
    return number > MAX;
}

function modBlock(number) {
    return number % MAX;
}

function deepRead(fromTo, structure, fn, memo, inclusiveMin, exclusiveMax, length, depth) {
    if (largerThanBlock(exclusiveMax - inclusiveMin)) {
        return keepDeepReading(fromTo, structure, fn, memo, inclusiveMin, exclusiveMax, length, depth);
    } else {
        return fromTo(function (index, memo) {
            return fn(memo, structure[index], inclusiveMin + index, structure);
        }, memo, modBlock(inclusiveMin), modBlock(exclusiveMax - 1), 1);
    }
}

function setOutsideOfCapacity(trie, indexPath, value) {
    var index = base32ToIndex(indexPath);
    var length = index + 1;
    var currentDepth = trie.depth;
    var neededDepth = computeDepth(length);
    var result = trie;
    while (currentDepth < neededDepth) {
        result.length = result.capacity();
        result = result.bunch();
        currentDepth = result.depth;
    }
    result.length = length;
    return setWithinCapacity(result, indexPath, value);
}

function setWithinCapacity(trie, indexPath, value) {
    // modify the trie
    var next, first = indexPath[0],
        index = base32ToIndex(first);
    return trie.ofMutable(trie.depth ? function (trie, readable, mutable) {
        var result = readable;
        var subTrie = readable[index];
        var next = nextChunk(indexPath);
        var sub = subTrie || trie.subtrie();
        var afterSet = setWithinCapacity(sub, next, value);
        if (subTrie !== afterSet) {
            result = mutable();
            result[index] = afterSet;
            return new Trie({
                length: trie.length,
                depth: trie.depth,
                value: result
            });
        }
    } : function (trie, readable, mutable) {
        var length, result;
        if (readable[index] !== value) {
            result = mutable();
            result[index] = value;
            length = clamp(trie.length, index + 1);
            return new Trie({
                length: length,
                depth: trie.depth,
                value: result
            });
        }
    });
}

function get(trie, indexPath) {
    var next, first = indexPath[0],
        sub = trie.value[base32ToIndex(first)];
    return trie.depth ? get(sub, nextChunk(indexPath)) : sub;
}

function Trie(options, structure) {
    var trie = this;
    assign(trie, options);
    trie.mutating = 0;
}

function computeCapacity(depth) {
    return Math.pow(MAX, depth + 1);
}

function computeDepth(length) {
    return length > MAX ? 1 + computeDepth(length / MAX) : 0;
}

function appropriatelySized(length) {
    return new Array(length || MAX);
}

function iterate(trie, level, fn, memo, index, depth) {
    var blockSize = Math.pow(MAX, depth);
    return fromTo(function (index, memo) {
        return !depth ? fn(index, trie, memo) : iterate(trie, level, fn, memo, index, depth);
    }, memo, index, index + (level.length * blockSize) - 1, blockSize);
}

function binaryToPathIndex(index, depth) {
    var base = toBase32(index);
    var fillUntil = depth - base.length;
    return fromTo(function (i, memo) {
        return 0 + memo;
    }, base, 0, fillUntil, 1);
}

function toIndexPath(index, depth) {
    return isString(index) ? index : (isArray(index) ? index : binaryToPathIndex(index, depth));
}