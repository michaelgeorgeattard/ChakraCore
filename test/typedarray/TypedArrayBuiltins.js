//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Verifies TypedArray builtin properties 

if (this.WScript && this.WScript.LoadScriptFile) { // Check for running in ch
    this.WScript.LoadScriptFile("..\\UnitTestFramework\\UnitTestFramework.js");
}

function mangle(u8) {
    u8.length = -2;
    u8.byteLength = 2000;
    u8.byteOffset = 45;
    u8.buffer = 25;
    u8.BYTES_PER_ELEMENT = 4;
}

var tests = [
    {
        name: "TypedArray builtin properties can't be overwritten, but writing to them does not throw an error",
        body: function () {
            var arr = new ArrayBuffer(100);
            var u8 = new Uint8Array(arr, 90);
            
            for (var i = 0; i < u8.length; i++) {
                u8[i] = i;
            }
            
            mangle(u8);

            assert.areEqual(10, u8.length, "Writing to length has no effect");
            assert.areEqual(10, u8.byteLength, "Writing to byteLength has no effect");
            assert.areEqual(90, u8.byteOffset, "Writing to byteOffset has no effect");
            assert.areEqual(1, u8.BYTES_PER_ELEMENT, "Writing to BYTES_PER_ELEMENT has no effect");
            assert.isTrue(arr === u8.buffer, "Writing to buffer has no effect");

            assert.throws(function() { Array.prototype.splice.call(u8, 4, 3, 1, 2, 3, 4, 5); }, TypeError, "Array.prototype.splice tries to set the length property of the TypedArray object which will throw", "Cannot define property: object is not extensible");
            assert.areEqual(10, u8.length, "Array.prototype.splice throws when it tries to set the length property");
            assert.areEqual(10, u8.byteLength, "The byteLength property should not be changed");
            assert.areEqual([0,1,2,3,1,2,3,4,5,7], u8, "After splice, array has correct values - NOTE: last two values are gone from the array");

            assert.throws(function() { Array.prototype.push.call(u8, 100); }, TypeError, "Array.prototype.push tries to set the length property of the TypedArray object which will throw", "Cannot define property: object is not extensible");
            assert.areEqual([0,1,2,3,1,2,3,4,5,7], u8, "Array.prototype.push doesn't modify the TypedArray");
        }
    },
    {
        name: "TypedArray constructed out of an iterable object",
        body: function () {
            function getIterableObj (array)
            {
                return {
                    [Symbol.iterator]: ()=> {
                        return {
                            next: () => {
                                return {
                                    value: array.shift(),
                                    done: array.length == 0
                                };
                            }
                        };
                    }
                };
            }

            var TypedArray = [
                'Int8Array',
                'Uint8Array',
                'Uint8ClampedArray',
                'Int16Array',
                'Uint16Array',
                'Int32Array',
                'Uint32Array',
                'Float32Array',
                'Float64Array'
            ];

            for(var t of TypedArray) {
                var arr = new this[t](getIterableObj([1,2,3,4]));
                assert.areEqual(3, arr.length, "TypedArray " + t + " created from iterable has length == 3");
                assert.areEqual(1, arr[0], "TypedArray " + t + " created from iterable has element #0 == 1");
                assert.areEqual(2, arr[1], "TypedArray " + t + " created from iterable has element #1 == 2");
                assert.areEqual(3, arr[2], "TypedArray " + t + " created from iterable has element #2 == 3");
            }

            for(var t of TypedArray) {
                var a = [1,2,3,4];
                a[Symbol.iterator] = getIterableObj([99,0])[Symbol.iterator];
                var arr = new this[t](a);
                assert.areEqual(1, arr.length, "TypedArray " + t + " created from array with user-defined iterator has length == 1");
                assert.areEqual(99, arr[0], "TypedArray " + t + " created from array with user-defined iterator has element #0 == 99");
            }

            function testTypedArrayConstructorWithIterableArray(t) {
                Array.prototype[Symbol.iterator] = getIterableObj([99,0])[Symbol.iterator];
                var arr = new this[t](a);
                assert.areEqual(1, arr.length, "TypedArray " + t + " created from array with Array.prototype overridden has length == 1");
                assert.areEqual(99, arr[0], "TypedArray " + t + " created from array with Array.prototype overriden has element #0 == 99");
            }

            var builtinArrayPrototypeIteratorDesc = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator);
            var a = [1,2,3,4];
            Object.defineProperty(Array.prototype, Symbol.iterator, {enumerable: false, configurable: true, writable: true});
            testTypedArrayConstructorWithIterableArray('Int8Array');
            testTypedArrayConstructorWithIterableArray('Uint8Array');
            testTypedArrayConstructorWithIterableArray('Uint8ClampedArray');
            testTypedArrayConstructorWithIterableArray('Int16Array');
            testTypedArrayConstructorWithIterableArray('Uint16Array');
            testTypedArrayConstructorWithIterableArray('Int32Array');
            testTypedArrayConstructorWithIterableArray('Uint32Array');
            testTypedArrayConstructorWithIterableArray('Float32Array');
            testTypedArrayConstructorWithIterableArray('Float64Array');
            Object.defineProperty(Array.prototype, Symbol.iterator, builtinArrayPrototypeIteratorDesc);
        }
    }
];

testRunner.runTests(tests);
