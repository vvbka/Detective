/**
 * lib/priority.js
 * a LIFO auto-sort extension of JS arrays.
 *
 * Copyright (C) 2015 Karim Alibhai.
 * Copyright (C) 2015 Valen Varangu Booth.
 **/

"use strict";

require('array.prototype.findindex');

var sort = function (arr, compare, key) {
        var l = arr.length,
            val, i, j

        for (i = 0; i < l; i += 1) {
            val = arr[i]

            for (j = i - 1; j > -1; j -= 1) {
                if (key === undefined) {
                    if (compare(arr[j], val)) break
                } else {
                    if (compare(arr[j][key], val[key])) break
                }

                arr[j + 1] = arr[j]
            }

            arr[j + 1] = val
        }

        return arr
    },
    Priority = function (key, comp) {
        this.key = key
        this.comp = comp || function (a, b) {
            return (b - a) < 0
        }
    }

// this helps maintain all array
// traits
Priority.prototype = []

// .first()
// grab first element
Priority.prototype.first = function () {
    return this[0]
}

// .last()
// grab last element
Priority.prototype.last = function () {
    return this[this.length - 1]
}

// .add([element])
// push on an element into the correct place
Priority.prototype.add = function (elm) {
    this.push(elm)
    return sort(this, this.comp, this.key)
}

// .pop()
// pop off the last element, and return
// it
Priority.prototype.pop = function () {
    return this.splice(0, 1)[0]
}


//update([search key],[new element])
//Updates an existing element in the array, accepts the key for the object 
Priority.prototype.update = function (searchKey, newElm) {
    var matchThis = newElm[searchKey];
    var itmIndex = this.findIndex(function (elem, index) {
        return elem[searchKey].toString() === matchThis.toString();
    });
    if (!(~itmIndex)) return -1;

    console.log('replaced: ' + JSON.stringify(this[itmIndex]) + ' at index ' + itmIndex + ' with ' + JSON.stringify(newElm));
    this[itmIndex] = newElm;

    return sort(this, this.comp, this.key);
};

// .filter()
// just like array.prototype.filter
Priority.prototype.filter = function (fn, ctx) {
    var array = new Priority(this.key, this.comp),
        i;
    ctx = ctx || this;

    for (i = 0; i < this.length; i += 1) {
        if (fn.call(ctx, this[i], i, this)) {
            array.add(this[i]);
        }
    }

    return array;
};

// .clone()
// create a copy of the priority queue
Priority.prototype.clone = function () {
    var narray = new Priority(this.key, this.comp);
    for (var elm of this) narray.add(elm);
    return narray;
};

// .concat()
// simplified array.concat()
Priority.prototype.concat = function (array) {
    var narray = this.clone();
    for (var elm of array) narray.add(elm);
    return narray;
};

module.exports = function (key, comp) {
    return new Priority(key, comp)
}
