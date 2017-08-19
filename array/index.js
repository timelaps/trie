module.exports = TrieMaker;
TrieMaker.constructor = Trie;
var u, repeat = require('@timelaps/string/base/repeat');
var MAX = 32;
var maxBinaryBlockLength = MAX.toString(2).length - 1;
var zerostring = repeat('0', maxBinaryBlockLength);
var fromTo = require('@timelaps/n/from/to');
var isUndefined = require('@timelaps/is/undefined');
var assign = require('@timelaps/object/assign');
var create = require('@timelaps/object/create');
var reduce = require('@timelaps/array/reduce');
var isArray = require('@timelaps/is/array');
var isNumber = require('@timelaps/is/number');
var clamp = require('@timelaps/number/clamp');

function TrieMaker(original_) {
    var original = original_ || [];
    var length = original.length;
    var depth = computeDepth(length);
    return new Trie({
        depth: depth,
        length: length
    }, churn(original, 0, length, length, depth));
}

function fullBinary(binary) {
    var filled = binary;
    var length = binary.length;
    var needs = Math.ceil(length / maxBinaryBlockLength) * maxBinaryBlockLength;
    var delta = needs - length;
    return delta ? (zerostring.slice(0, delta) + binary) : binary;
}

function binaryToIndex(binary) {
    return parseInt(binary, 2);
}

function nextChunk(binary) {
    return binary.slice(1);
}

function toBinary(number) {
    return parseInt(number).toString(2);
}

function isGreaterThanMax(binary) {
    return binary.length > maxBinaryBlockLength;
}

function getAlongPath(path, structure) {
    var item = structure[binaryToIndex(path[0])];
    // we can do this because
    return path[1] ? getAlongPath(nextChunk(path), item) : item;
}

function setInCurrentStructure(structure_, path, item_, mutable) {
    var next, updated, mutated, item, structure = structure_;
    var first = path[0];
    var index = binaryToIndex(first);
    var current = structure[index];
    if (path[1]) {
        next = nextChunk(path);
        if (current) {
            mutated = setInCurrentStructure(current, next, item_);
            if (mutated !== current) {
                structure = structure.slice(0);
                structure[index] = mutated;
            }
        } else {
            structure = mutable ? structure : structure.slice(0);
            structure[index] = setInCurrentStructure(appropriatelySized(), next, item_, true);
        }
        return structure;
    } else {
        updated = structure;
        item = item_(current);
        if (item !== current) {
            updated = mutable ? structure : structure.slice(0);
            updated[index] = item;
        }
        return updated;
    }
}

function setAlongPath(trie, index, item) {
    var newDepth, mutated, structure = trie.value,
        depth = trie.depth,
        length = trie.length,
        maxWithoutBunching = Math.pow(MAX, depth + 1);
    if (maxWithoutBunching <= index) {
        // bunch me please
        newDepth = computeDepth(index);
        maxWithoutBunching = newDepth - depth;
        mutated = structure;
        while (maxWithoutBunching > 0) {
            maxWithoutBunching -= 1;
            structure = mutated;
            mutated = appropriatelySized();
            mutated[0] = structure;
        }
        depth = newDepth;
        mutated = setInCurrentStructure(mutated, toIndexPath(index, depth), item, true);
    } else {
        mutated = setInCurrentStructure(structure, toIndexPath(index, depth), item);
    }
    if (structure !== mutated) {
        return new Trie({
            depth: depth,
            length: (length > index ? length : index + 1)
        }, mutated);
    }
    return this;
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
    if (exclusiveMax - inclusiveMin > MAX) {
        return keepChurning(original, inclusiveMin, exclusiveMax, length, depth);
    } else {
        return slice(original, inclusiveMin, exclusiveMax);
    }
}

function keepDeepChurning(structure, fn, memo, inclusiveMin, exclusiveMax, length, depth, blockSize) {
    return fromTo(function (index, memo) {
        return deepChurn(structure, fn, memo, index, index + blockSize, length, depth - 1, blockSize);
    }, memo, inclusiveMin, exclusiveMax - 1, blockSize);
}

function deepChurn(structure, fn, memo, inclusiveMin, exclusiveMax, length, depth, blockSize) {
    if (exclusiveMax - inclusiveMin > MAX) {
        return keepDeepChurning(structure, fn, memo, inclusiveMin, exclusiveMax, length, depth, blockSize);
    } else {
        return fromTo(function (index, memo) {
            return fn(memo, structure[index], index, structure);
        }, memo, inclusiveMin, exclusiveMax - 1, 1);
    }
}
Trie.prototype = {
    fromTo: function (fn, memo, start, end, blockSize) {
        var length = this.length;
        return deepChurn(this.value, fn, memo, start || 0, end || length, length, this.depth, blockSize || 1);
    },
    fromToEnd: function () {},
    get: function (index) {
        return index < this.length ? getAlongPath(toIndexPath(index, this.depth), this.value) : undefined;
    },
    ofMutable: function (fn, memo) {
        var result, trie = this;
        trie.mutating += 1;
        result = fn(trie, trie.value);
        trie.mutating -= 1;
        return result;
    },
    set: function (index, item) {
        // // modify the trie
        return this.ofMutable(function (trie) {
            return setAlongPath(trie, index, function () {
                return item;
            });
        });
    }
};

function Trie(options, structure) {
    var trie = this;
    assign(trie, options);
    trie.mutating = 0;
    trie.value = structure;
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
    var binary = fullBinary(index);
    var length = binary.length / maxBinaryBlockLength;
    var fillUntil = depth - length + 1;
    return fromTo(function (i, memo) {
        var start;
        if (fillUntil > i) {
            memo[i] = zerostring;
        } else {
            start = (i - fillUntil) * maxBinaryBlockLength;
            memo[i] = binary.slice(start, start + maxBinaryBlockLength);
        }
        return memo;
    }, appropriatelySized(depth + 1), 0, depth, 1);
}

function numberToIndexPath(index, depth) {
    return binaryToPathIndex(toBinary(index), depth);
}

function toIndexPath(index, depth) {
    return isArray(index) ? index : isNumber(index) ? numberToIndexPath(index, depth) : binaryToPathIndex(index, depth);
}