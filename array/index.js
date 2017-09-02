module.exports = TrieMaker;
TrieMaker.constructor = Trie;
var u;
var MAX = 32;
TrieMaker.MAX = MAX;
var fromTo = require('@timelaps/n/from/to');
var isUndefined = require('@timelaps/is/undefined');
var assign = require('@timelaps/object/assign');
var create = require('@timelaps/object/create');
var reduce = require('@timelaps/array/reduce');
var isArray = require('@timelaps/is/array');
var isNumber = require('@timelaps/is/number');
var clamp = require('@timelaps/number/clamp');
var isString = require('@timelaps/is/string');
var bindTo = require('@timelaps/fn/bind/to');
var toArrayFromArrayLike = require('@timelaps/to/array/from/array-like');
var concat = require('@timelaps/array/concat');
var toArray = require('@timelaps/to/array');
var cacheable = require('@timelaps/fn/cacheable');
var computeCapacity = cacheable(computesCapacity);
var computeDepth = cacheable(computesDepth);
var computeBlockSize = cacheable(computesBlockSize);
var base32ToIndex = cacheable(base32ToIndexer);
var repeat0s = cacheable(repeat0sMaker);
Trie.prototype = {
    constructor: Trie,
    fromTo: function (fn, memo, start, end) {
        var length = this.length;
        return deepRead(fromTo, this.value, fn, memo, start || 0, end || length, length, this.depth);
    },
    reduce: function (fn, memo) {
        return this.fromTo(bindTo(fn, this), memo);
    },
    copy: function () {
        var trie = this;
        return new Trie({
            depth: trie.depth,
            length: trie.length,
            value: trie.value.slice(0)
        });
    },
    forEach: bindFirst(function (trie, fn) {
        // drop all memos
        trie.fromTo(function (memo, value, index) {
            fn(value, index, trie);
        });
        return trie;
    }),
    map: bindFirst(function (trie, fn) {
        return trie.fromTo(function (memo, value, index) {
            //
        });
    }),
    push: function () {
        // use a super optimized route for one
        return concatSome(this, toArrayFromArrayLike(arguments));
    },
    concat: function () {
        return concatSome(this, concat(toArrayFromArrayLike(arguments)));
    },
    get: function (index) {
        return index < this.length ? get(this, this.toIndexPath(index)) : u;
    },
    fromToWrite: function (inclusiveMin, exclusiveMax, fn) {
        return this.ofMutable(function (trie) {
            //
        });
    },
    write: function (index, fn) {
        return this.ofMutable(this.depth ? function (trie) {
            var subtrie = trie.access(index);
            var sub = subtrie || trie.subtrie();
            var next = nextChunk(index);
            var updated = sub.write(next, fn);
            // if (updated !== )
        } : function (trie) {
            //
        });
    },
    mutable: function () {
        return this.mutated || (this.mutated = this.copy());
    },
    ofMutable: function (fn) {
        var mutated, trie = this;
        trie.mutating += 1;
        var result = fn(trie);
        trie.mutating -= 1;
        if (!trie.mutating && (mutated = result || trie.mutated)) {
            delete trie.mutated;
            return mutated;
        }
        return trie;
    },
    set: function (index, item) {
        var trie = this;
        var indexPath = trie.toIndexPath(index);
        var method = index < trie.capacity ? setWithinCapacity : setOutsideOfCapacity;
        return method(trie, indexPath, item);
    },
    subtrie: function () {
        return new Trie({
            depth: this.depth - 1,
            length: 0,
            value: appropriatelySized()
        });
    },
    bunch: function (options) {
        var list = appropriatelySized();
        list[0] = this;
        return new Trie({
            depth: this.depth + 1,
            length: this.length,
            value: list
        });
    },
    bunchUntil: function (length) {
        var trie = this,
            result = trie,
            neededDepth = computeDepth(length),
            currentDepth = trie.depth;
        while (currentDepth < neededDepth) {
            result.length = result.capacity;
            result = result.bunch();
            currentDepth = result.depth;
        }
        return result;
    },
    access: function (index) {
        return this.value[base32ToIndex(index)];
    },
    toIndexPath: function (index) {
        return toIndexPath(index, this.depth);
    },
    lastIndex: function () {
        return base32ToIndex(this.toIndexPath(this.length - 1)[0]);
    }
};

function concatSome(trie, some) {
    var length = some.length;
    if (length > 1) {
        return concatMany(trie, some);
    } else if (length === 1) {
        return concatOne(trie, some[0]);
    } else {
        // unchanged. nothing to add
        return trie;
    }
}

function fillChildren(trie, array, start_, end_, indexPath) {
    var concatable, added, concatableValue, end = end_,
        start = start_,
        index = base32ToIndex(indexPath[0]),
        next = nextChunk(indexPath),
        value = trie.value[index],
        baseline = index,
        block = trie.block,
        exclusiveMax = array.length,
        capacity = trie.capacity,
        length = trie.length,
        absoluteMax = clamp(array.length, 0, capacity - trie.length),
        mutable = trie.mutable();
    if (value) {
        end = clamp(end, 0, value.capacity - value.length);
        start = fillToCapacityAndReplace(mutable, index, value, array, start, end, next);
        baseline += 1;
    }
    if (start >= absoluteMax) {
        mutable.length = trie.length + start;
        return start;
    }
    concatable = churn(array, start, exclusiveMax, absoluteMax, trie.depth, start);
    added = start + concatable.length;
    concatableValue = concatable.value;
    fromTo(function (index, value) {
        value[baseline + index] = concatableValue[index];
        return value;
    }, mutable.value, 0, concatable.lastIndex(), 1);
    mutable.length = trie.length + added;
    return added;
}

function fillToCapacityAndReplace(parent, index, trie, array, start, end, indexPath) {
    var added;
    parent.value[index] = trie.ofMutable(function (trie) {
        added = fillToCapacity(trie, array, start, end, indexPath);
    });
    return added;
}

function fillToCapacity(trie, array, start, end, indexPath) {
    var method = trie.depth ? fillChildren : fillShallow;
    return method(trie, array, start, end, indexPath);
}

function fillShallow(trie, array, start, end, begin) {
    var added = end - start;
    if (!added) {
        return added;
    }
    var mutable = trie.mutable(),
        offset = base32ToIndex(begin || 0),
        value = mutable.value,
        length = mutable.length;
    if (!added) {
        return added;
    }
    fromTo(function (index, memo) {
        memo[offset + index] = array[index];
        return memo;
    }, value, start, end - 1, 1);
    mutable.length = length + added;
    return added;
}

function fillOverCapacity(trie, array, start, end) {
    var nextLength = trie.length + end - start;
    var nextTrie = trie.bunchUntil(nextLength);
    var indexPath = nextTrie.toIndexPath(trie.length);
    fillToCapacity(nextTrie, array, start, end, indexPath);
    return nextTrie.mutable();
}

function concatOne(trie, next) {
    // too simple
    return trie.set(trie.length, next);
}

function concatOneAlternative(trie, next) {
    var length = trie.length;
    var block = trie.block;
    if (block !== 1 && length % block) {
        // needs a whole new block
    } else if (length % MAX === 0) {
        // needs a new one added on
    } else {
        // it can fit more in
    }
}

function concatMany(trie, extension) {
    var start = 0,
        baseline = trie,
        length = baseline.length,
        capacity = baseline.capacity,
        final = extension.length,
        end = clamp(capacity - length, 0, final);
    return trie.ofMutable(function (trie) {
        var added, mutable, indexPath;
        if (end) {
            indexPath = trie.toIndexPath(trie.length);
            added = fillToCapacity(trie, extension, 0, end, indexPath);
        }
        if (end < final) {
            // returns the bunched version
            return fillOverCapacity(trie, extension, end, final);
        }
    });
}

function bindFirst(fn) {
    return function (runner) {
        return fn(trie, bindTo(runner, this));
    };
}

function TrieMaker(original_) {
    var original = original_ || [];
    var length = original.length;
    var depth = computeDepth(length);
    return churn(original, 0, length, length, depth, 0);
}

function base32ToIndexer(binary) {
    return parseInt(binary, MAX);
}

function nextChunk(binary) {
    return binary.slice(1);
}

function toBase32(number) {
    return parseInt(number).toString(MAX);
}

function keepChurning(original, inclusiveMin, exclusiveMax, length, depth, offset) {
    var block = computeBlockSize(depth);
    return fromTo(function (index, memo) {
        var idx = ((index - offset) / block) % MAX;
        memo[idx] = churn(original, index, clamp(index + block, 0, length), length, depth - 1, offset);
        return memo;
    }, appropriatelySized(), inclusiveMin, clamp(exclusiveMax, 0, length) - 1, block);
}

function slice(original, inclusiveMin, exclusiveMax) {
    return original.slice(inclusiveMin, exclusiveMax);
}

function churn(original, inclusiveMin, exclusiveMax, length, depth, offset) {
    var next;
    if (depth || exclusiveMax - inclusiveMin > MAX) {
        next = keepChurning(original, inclusiveMin, exclusiveMax, length, depth, offset);
    } else {
        next = expandList(original, inclusiveMin, exclusiveMax);
    }
    return new Trie({
        depth: depth,
        length: exclusiveMax - inclusiveMin,
        value: next
    });
}

function keepDeepReading(fromTo, structure, fn, memo, inclusiveMin, exclusiveMax, length, depth) {
    var block = computeBlockSize(depth);
    return fromTo(function (index, memo) {
        var idx = (index / block) % MAX,
            trie = structure[idx];
        if (!trie) {
            return memo;
        }
        var exclusiveMax = clamp(index + block, 0, length);
        return deepRead(fromTo, trie.value, fn, memo, index, exclusiveMax, length, depth - 1);
    }, memo, inclusiveMin, clamp(exclusiveMax, 0, length) - 1, block);
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
    var index = base32ToIndex(indexPath),
        length = index + 1,
        result = trie.bunchUntil(length);
    result.length = length;
    return setWithinCapacity(result, indexPath, value);
}

function setWithinCapacity(trie, indexPath, value) {
    // modify the trie
    var first = indexPath[0],
        index = base32ToIndex(first),
        next = nextChunk(indexPath),
        minLength = base32ToIndex(indexPath) + 1;
    return trie.ofMutable(trie.depth ? function (trie) {
        var result = trie,
            subTrie = trie.value[index],
            sub = subTrie || trie.subtrie(),
            length = sub.length || (computeBlockSize(sub.depth) * index),
            afterSet = setWithinCapacity(sub, next, value);
        if (subTrie !== afterSet) {
            result = trie.mutable();
            result.value[index] = afterSet;
            result.length = clamp(length, minLength);
        }
    } : function (trie) {
        var result = trie,
            current = trie.value[index];
        if (current !== value) {
            result = trie.mutable();
            result.value[index] = value;
            result.length = clamp(trie.length, index + 1);
        }
    });
}

function get(trie, indexPath) {
    var sub = trie.access(indexPath[0]);
    return trie.depth ? get(sub, nextChunk(indexPath)) : sub;
}

function Trie(options) {
    var trie = this;
    trie.value = options.value;
    trie.length = options.length;
    var depth = trie.depth = options.depth;
    trie.block = computeBlockSize(depth);
    trie.capacity = computeCapacity(depth);
    trie.mutating = 0;
}

function expandList(list, from, to) {
    if (to - from === MAX) {
        return list.slice(from, to);
    }
    return fromTo(function (index, memo) {
        memo[index - from] = list[index];
        return memo;
    }, appropriatelySized(), from, to - 1, 1);
}

function computesCapacity(depth) {
    return MAX * computesBlockSize(depth);
}

function computesDepth(length) {
    return length > MAX ? 1 + computeDepth(length / MAX) : 0;
}

function computesBlockSize(depth) {
    return Math.pow(MAX, depth);
}

function appropriatelySized(length) {
    return [];
}

function iterate(trie, level, fn, memo, index, depth) {
    var block = computeBlockSize(depth);
    return fromTo(function (index, memo) {
        return !depth ? fn(index, trie, memo) : iterate(trie, level, fn, memo, index, depth);
    }, memo, index, index + (level.length * block) - 1, block);
}

function binaryToPathIndex(index, depth) {
    var base = toBase32(index);
    var fillUntil = depth - base.length;
    return repeat0s(fillUntil) + base;
}

function repeat0sMaker(howmany) {
    return fromTo(function (i, memo) {
        return memo + '0';
    }, '', 0, howmany, 1);
}

function toIndexPath(index, depth) {
    return isString(index) ? index : (isArray(index) ? index : binaryToPathIndex(index, depth));
}