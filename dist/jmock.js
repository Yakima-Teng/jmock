(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.jmock = {}));
}(this, function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var isDefined = function (val) {
        return typeof val !== 'undefined';
    };

    /**
     * randomly return true or false
     * @param {number} [probability] the probability to return true, must be a value between 0 and 1 (including 0 and 1)
     *
     * @example
     * ```javascript
     * Mock.Random.boolean(0.9) // true
     * ```
     */
    var bool = function (probability) {
        if (!isDefined(probability)) {
            return Math.random() > 0.5;
        }
        return Math.random() > (1 - probability);
    };
    /**
     * randomly return an integer
     * @param {number} [min]
     * @param {number} [max]
     */
    var int = function (min, max) {
        min = isDefined(min) ? parseInt('' + min, 10) : -9007199254740992; // -2^53
        max = isDefined(max) ? parseInt('' + max, 10) : 9007199254740992; // 2^53
        return Math.round(Math.random() * (max - min)) + min;
    };
    /**
     * randomly return a natural number (0, and positive integer)
     * @param {number} [min]
     * @param {number} [max]
     *
     * @example
     * ```javascript
     * Mock.Random.natural(10, 20) // 10
     * ```
     */
    var natural = function (min, max) {
        min = isDefined(min) ? parseInt('' + min, 10) : 0;
        return int(min, max);
    };
    /**
     * randomly return a character
     * @param {string} clue 'lower', 'upper', 'number', 'symbol', 'alpha', or other given string
     */
    var char = function (clue) {
        var lower = 'abcdefghijklmnopqrstuvwxyz';
        var upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var number = '0123456789';
        var symbol = '!@#$%^&*()[]-+`~;\'\\":,./<>?|}{';
        var alpha = lower + upper;
        var together = [alpha, number, symbol].join('');
        var pools = { lower: lower, upper: upper, number: number, symbol: symbol, alpha: alpha };
        var pool = !isDefined(clue) ? together : (pools[clue.toLowerCase()] || clue);
        return pool.charAt(natural(0, pool.length - 1));
    };
    /**
     * randomly return a float number
     * @param min
     * @param max
     * @param minDecimalLength
     * @param maxDecimalLength
     */
    var float = function (min, max, minDecimalLength, maxDecimalLength) {
        minDecimalLength = isDefined(minDecimalLength) ? minDecimalLength : 0;
        maxDecimalLength = isDefined(maxDecimalLength) ? maxDecimalLength : 17;
        // ensure length of decimal part is between [0, 17]
        minDecimalLength = Math.max(Math.min(minDecimalLength, 17), 0);
        maxDecimalLength = Math.max(Math.min(maxDecimalLength, 17), 0);
        var decimalLength = natural(minDecimalLength, maxDecimalLength);
        var returnNum = int(min, max) + '.';
        for (var i = 0; i < decimalLength; i++) {
            // the last dicimal number should not be zero, for it will be ignore by JS engine
            returnNum += (i < decimalLength - 1) ? char('number') : char('123456789');
        }
        return parseFloat(returnNum);
    };
    var Basic = {
        bool: bool,
        int: int,
        natural: natural,
        char: char,
        float: float
    };

    var Random = __assign({}, Basic);

    var Mock = /** @class */ (function () {
        function Mock() {
        }
        Mock.Random = Random;
        return Mock;
    }());

    exports.Mock = Mock;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=jmock.js.map
