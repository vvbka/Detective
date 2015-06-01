/**
 * lib/priority.js
 * a LIFO auto-sort extension of JS arrays.
 *
 * Copyright (C) 2015 Karim Alibhai.
 * Copyright (C) 2015 Valen Varangu Booth.
 **/

"use strict";

var sort = function(arr, compare, key) {
  var l = arr.length
    , val
    , i
    , j

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

module.exports = function (key, comp) {
  return new Priority(key, comp)
}
