// var b = require('@timelaps/batterie');
// var Immutable = require('.');
// b.describe('Immutable', function () {
//     b.expect(Immutable).toBeFunction();
//     b.describe('methods', function () {
//         b.describe('get', function () {
//             b.it('can get from the original structure', function (t) {
//                 var static = Immutable({
//                     key: 'value'
//                 });
//                 t.expect(static.get('key')).toBe('value');
//             });
//         });
//         b.describe('set', function () {
//             b.it('will set values on a new structure', function (t) {
//                 var static = Immutable({
//                     key: 'value'
//                 });
//                 var s1 = static.set('key', 1);
//                 t.expect(static.get('key')).toBe('value');
//                 t.expect(s1.get('key')).toBe(1);
//             }, 2);
//             b.it('will not return a copy if the value has not changed', function (t) {
//                 var s0 = Immutable({
//                     key: 'value'
//                 });
//                 var s1 = s0.set('key', 'value');
//                 t.expect(s1).toBe(s0);
//             });
//         });
//         b.describe('is', function () {
//             b.it('can check its structure', function (t) {
//                 var static = Immutable({
//                     key: 'value'
//                 });
//                 t.expect(static.is('key', 'value')).toBeTrue();
//                 var s1 = static.set('key', 1);
//                 t.expect(static.is('key', 'value')).toBeTrue();
//                 t.expect(s1.is('key', 1)).toBeTrue();
//             }, 3);
//         });
//     });
//     b.describe('reusability', function () {
//         b.it('uses the same immutable objects as often as possible', function (t) {
//             var s0 = Immutable();
//             var s1 = Immutable();
//             t.expect(s0).toBe(s1);
//         });
//         b.it('applies to deep objects as well', function (t) {
//             var s1 = Immutable({
//                 values: 5
//             });
//             var s0 = Immutable({
//                 some: {
//                     deep: {
//                         values: 5
//                     }
//                 }
//             });
//             t.expect(s0.get('some').get('deep')).toBe(s1);
//         });
//         b.it('setting in the structure will reuse what is available', function (t) {
//             var s1 = Immutable({
//                 a: {
//                     deep: {
//                         values: 5
//                     }
//                 },
//                 b: {
//                     deeper: {
//                         values: {
//                             still: true
//                         }
//                     }
//                 }
//             });
//             var s2 = s1.setDeep(['b', 'deeper'], {
//                 values: 5
//             });
//             t.expect(s2.getDeep(['b', 'deeper'])).toBe(s1.getDeep(['a', 'deep']));
//         });
//     });
//     b.describe('circularity', function () {
//         b.it('works', function (t) {
//             var a = [];
//             var b = {
//                 a: a
//             };
//             var c = [b];
//             a.push(c);
//             var s1 = Immutable(c);
//             t.expect(s1).toBeInstance(Immutable.constructor);
//         });
//     });
// });