// var Classy = require('@timelaps/classy'),
//     map = require('@timelaps/n/map'),
//     mapValues = require('@timelaps/n/map/values'),
//     maker = require('@timelaps/fn/intended/maker'),
//     checkMany = maker(reduceArrayLike, reduceObject),
//     isArrayLike = require('@timelaps/is/array-like'),
//     isObject = require('@timelaps/is/object'),
//     has = require('@timelaps/n/has/shallow'),
//     get = require('@timelaps/n/get/shallow'),
//     set = require('@timelaps/n/set/shallow'),
//     del = require('@timelaps/n/del/shallow'),
//     indexOf = require('@timelaps/n/index/of'),
//     constructorName = require('@timelaps/fn/constructor-name'),
//     setDeep = require('@timelaps/n/set/deep'),
//     forOwnEnd = require('@timelaps/n/for/own/end'),
//     isValidIndex = require('@timelaps/is/valid-index'),
//     toArrayFromArrayLike = require('@timelaps/to/array/from/array-like'),
//     assign = require('@timelaps/object/assign'),
//     returnsFirst = require('@timelaps/returns/first'),
//     isEqual = require('@timelaps/is/equal'),
//     keys = require('@timelaps/n/keys'),
//     isUndefined = require('@timelaps/is/undefined'),
//     toBoolean = require('@timelaps/hacks/to-boolean'),
//     forEach = require('@timelaps/n/for/each'),
//     reduceOwn = require('@timelaps/array/reduce/own'),
//     reduce = require('@timelaps/array/reduce'),
//     generator = require('@timelaps/fn/generator'),
//     isNumber = require('@timelaps/is/number'),
//     counter = 0,
//     b = require('@timelaps/batterie'),
//     repeat = require('@timelaps/string/base/repeat'),
//     Cluster = require('../../cluster'),
//     ImmutableLiteral = module.exports = Classy.extend('ImmutableLiteral', {
//         constructor: function (supr, args) {
//             var index, structure = args[0],
//                 second = args[1],
//                 chain = second || {
//                     id: counter += 1,
//                     stack: []
//                 },
//                 stack = chain.stack;
//             if ((index = indexOf(stack, structure)) !== -1) {
//                 return stack[index];
//             }
//             supr(args);
//             stack.push(structure);
//             var context = this,
//                 identifier = args[1] || (counter += 1),
//                 hasher = context.member('hasher'),
//                 pointers = context.member('pointers'),
//                 resolveStructure = context.member('resolveStructure'),
//                 infos = resolveStructure(context, structure, chain),
//                 value = context.value,
//                 hashed = hasher(value),
//                 name = constructorName(value),
//                 pointer = pointers.get(name, hashed);
//             stack.pop();
//             if (pointer) {
//                 // return another pointer
//                 return pointer;
//             }
//             context.changing = 0;
//             context.id = hashed;
//             // save pointer in map to be used next time
//             // this structure is created
//             pointers.set(name, hashed, context);
//             // returns this automatically
//         },
//         members: {
//             // assume whole thing is in a non mutable state
//             // and we're just keeping a reference to it
//             resolveStructure: resolveStructure,
//             reconcile: reconcile,
//             hasher: hash,
//             pointers: Cluster()
//         },
//         methods: {
//             is: function (prop, value) {
//                 return checkEqual(this.mutable()[prop], unwrap(value));
//             },
//             diffs: function (sets) {
//                 var immutable = this;
//                 return reduce(toArrayFromArrayLike(sets), function (memo, value) {
//                     return memo.concat(immutable.diff(value[0], value[1]));
//                 }, []);
//             },
//             diff: function (a, b, differences) {
//                 return checkMany(a, b, differ(this.mutable(), differences || []));
//             },
//             hash: function () {
//                 return this.id;
//             },
//             createNext: function () {
//                 var diffs = this.changes;
//                 delete this.changes;
//                 return this.createFrom(diffs);
//             },
//             createFrom: function (diffs) {
//                 var immutable = this;
//                 var reconciler = immutable.member('reconcile');
//                 var mutable = immutable.mutable();
//                 var reconciled = reconciler(immutable, diffs, returnsFirst);
//                 return immutable.__constructor__(reconciled);
//             },
//             mutable: function () {
//                 return this.value;
//             },
//             has: singleProxy(has),
//             get: singleProxy(get),
//             del: singleProxy(del),
//             set: function (prop, value) {
//                 var diffs;
//                 if (!(diffs = this.diff(prop, value)).length) {
//                     return this;
//                 }
//                 // get the latest constructor
//                 return this.createFrom(diffs);
//             },
//             queue: function (diffs) {
//                 this.changes = (this.changes || []).concat(diffs || []);
//                 return this;
//             },
//             getDeep: function (chain) {
//                 return reduce(chain, function (branch, key) {
//                     return branch && branch.get(key);
//                 }, this);
//             },
//             setDeep: function (chain, value) {
//                 // wasteful
//                 return this.set(toStructure(chain, value));
//             },
//             matches: function (object) {
//                 return computeDifferences(object, this.mutable());
//             },
//             isValueOf: function (object) {
//                 var alreadychecked = {};
//                 if (!isObject(object)) {
//                     return false;
//                 } else {
//                     return checkBothSidesForDifferences(this, object);
//                 }
//             },
//             isIterable: function () {
//                 return isIterable(this);
//             },
//             isRoot: function () {
//                 return !this.parent;
//             },
//             isLeaf: function () {
//                 return !this.isIterable();
//             },
//             isArray: function () {
//                 return this.isArrayLike();
//             },
//             isArrayLike: function () {
//                 return !this.keys;
//             },
//             toJSON: function () {
//                 return this.mutable();
//             }
//         }
//     });
// ImmutableLiteral.of = function of() {
//     return ImmutableLiteral(toArrayFromArrayLike(arguments));
// };

// function decideWhichStructure(key) {
//     return isValidIndex(key) && isNumber(key) ? [] : {};
// }

// function toStructure(path, value_) {
//     var first = path[0];
//     var value = value_;
//     if (!isUndefined(first)) {
//         value = decideWhichStructure(first);
//         value[first] = toStructure(path.slice(1), value_);
//     }
//     return value;
// }

// function register(immutable, hash) {
//     var id = immutable.id;
//     if (isUndefined(id)) {
//         id = immutable.id = immutable.member('hash')(immutable.mutable());
//     }
//     return id;
// }

// function hash(mutable) {
//     return isArrayLike(mutable) ? hashArray(mutable) : (isObject(mutable) ? hashObject(mutable) : simpleHash(null, mutable));
// }

// function simpleHash(key, value, memo) {
//     // number or string
//     return reduce((tv(key) + tv(value)).split(''), actualHash, memo || 0);

//     function tv(value) {
//         return constructorName(value) + value;
//     }
// }

// function actualHash(hash_, string) {
//     var char = string.charCodeAt(0),
//         hash = ((hash_ << 5) - hash_) + char;
//     return hash & hash; // Convert to 32bit integer
// }

// function hashImmutableUnder(key, immutable, memo) {
//     return simpleHash(key, 'immutable' + immutable.id, memo);
// }

// function hashKeyValuePairs(memo, value, key) {
//     if (isImmutable(value)) {
//         return hashImmutableUnder(key, value, memo);
//     } else {
//         return simpleHash(key, value, memo);
//     }
// }

// function hashObject(mutable) {
//     return reduceOwn(mutable, hashKeyValuePairs, 0);
// }

// function hashArray(mutable) {
//     return reduce(mutable, hashKeyValuePairs, 0);
// }

// function applyDifferences(mutable) {
//     return function (delta) {
//         delta(mutable);
//     };
// }

// function reconcileItem(differences, item) {
//     forEach(differences, applyDifferences(item));
//     return item;
// }

// function makeObjectCopy(object) {
//     // slow implementation for now
//     return assign({}, object);
// }

// function makeArrayCopy(array) {
//     // slow implementation for now
//     return array.slice(0);
// }

// function reconcile(immutable, differences, swapper) {
//     var mutable = immutable.mutable();
//     if (immutable.isArray()) {
//         return reconcileItem(differences, makeArrayCopy(mutable));
//     } else {
//         return reconcileItem(differences, makeObjectCopy(mutable));
//     }
// }

// function singleProxy(fn) {
//     return function (key) {
//         return fn(this.mutable(), key);
//     };
// }

// function checkBothSidesForDifferences(immutable, b) {
//     var alreadychecked = {};
//     var aKeys, bKeys, _a = immutable,
//         _b = b;
//     if (!isArrayLike(a)) {
//         _a = keys(a);
//         _b = keys(b);
//     }
//     if (_a.length !== _b.length) {
//         return false;
//     }
//     return checkForDifferences(this, object, alreadychecked) && checkForDifferences(object, this, alreadychecked);
// }

// function checkForDifferences(a, b, alreadychecked, sameLengths) {
//     return !isValidIndex(forOwnEnd(a, spotDifference(b, alreadychecked)));
// }

// function spotDifference(immutable, alreadychecked) {
//     var mutable = immutable.mutable();
//     return function (value, key) {
//         var current = mutable[key];
//         var valueIsImmutable = isImmutable(value);
//         if (isImmutable(current)) {
//             return current.matches(valueIsImmutable ? value.mutable() : value);
//         } else if (valueIsImmutable) {
//             return value.isValueOf(current);
//         } else {
//             return isValueEqual(current, value);
//         }
//     };
// }

// function isImmutable(item) {
//     return ImmutableLiteral.isInstance(item);
// }

// function unwrap(value) {
//     return isImmutable(value) ? value.mutable() : value;
// }

// function checkEqual(current, value) {
//     if (isImmutable(current) && isObject(value)) {
//         return current.findDifference(value);
//     }
//     return current === value;
// }

// function runFullImmutableCheck(current, value) {}

// function traverse(prop) {}

// function reduceArrayLike(key, value, fn) {
//     return reduceOwn(key, function (memo, key) {
//         return memo.concat(fn(key, value));
//     }, []);
// }

// function reduceObject(object, fn) {
//     return reduceOwn(object, function (memo, value, key) {
//         return memo.concat(fn(key, value));
//     }, []);
// }

// function differ(object, differences) {
//     return function differInstance(key, value) {
//         var fn, nu, diffs, current;
//         if ((current = object[key]) === value) {
//             return differences;
//         } else if (isImmutable(current)) {
//             if (isObject(value)) {
//                 nu = current.set(value);
//             }
//             if (nu === current) {
//                 return differences;
//             } else if (!nu) {
//                 fn = function (clone) {
//                     clone[key] = value;
//                 };
//             } else {
//                 fn = function (clone) {
//                     clone[key] = nu;
//                 };
//             }
//             return differences.concat([fn]);
//         }
//         return differences.concat([function (clone) {
//             clone[key] = value;
//         }]);
//     };
// }

// function resolveArrayLikeStructure(context, array, stack, maker) {
//     context.length = array.length;
//     var result = reduce(array, buildArrayWithImmutables(maker, stack), {
//         value: [],
//         hash: 0
//     });
//     context.value = result.value;
//     return context;
// }

// function buildArrayWithImmutables(maker, stack) {
//     return function (memo, value, index) {
//         var val = value;
//         var array = memo.value;
//         var hasher = simpleHash;
//         if (isObject(value)) {
//             val = maker(value, stack);
//             hasher = hashImmutableUnder;
//         }
//         memo.hash = hasher(index, val, memo.hash);
//         array.push(val);
//         memo.value.push(val);
//         return memo;
//     };
// }

// function resolveObjectStructure(context, object, stack, maker) {
//     // push because we're already
//     // getting keys inside of mapValues
//     var k = keys(object).sort();
//     context.keys = k;
//     context.length = k.length;
//     var result = reduce(k, buildObjectWithImmutables(maker, stack), {
//         hash: 0,
//         value: {},
//         maker: maker,
//         stack: stack,
//         original: object
//     });
//     context.value = result.value;
//     return context;
// }

// function buildObjectWithImmutables(maker, stack) {
//     return function (memo, key, index) {
//         var original = memo.original;
//         var copy = memo.value;
//         var value = original[key];
//         var hasher = simpleHash;
//         if (isObject(value)) {
//             value = maker(value, stack);
//             hasher = hashImmutableUnder;
//         }
//         memo.hash = hasher(key, value, memo.hash);
//         copy[key] = value;
//         return memo;
//     };
// }

// function isIterable(branch) {
//     return !isUndefined(branch.length);
// }

// function leaf(context, item) {
//     context.value = item;
//     return context;
// }

// function resolveStructure(context, item, stack) {
//     var resolveArrayLike = resolveArrayLikeStructure,
//         resolveObject = resolveObjectStructure;
//     // branches
//     if (isImmutable(item)) {
//         return item;
//     } else if (isArrayLike(item)) {
//         // should just array
//         return resolveArrayLikeStructure(context, item, stack, context.__constructor__);
//     } else if (isObject(item)) {
//         return resolveObjectStructure(context, item, stack, context.__constructor__);
//     } else {
//         // leaf
//         return leaf(context, item);
//     }

//     function resolve(item) {
//         return resolveStructure(context, item, resolveArrayLike, resolveObject);
//     }
// }