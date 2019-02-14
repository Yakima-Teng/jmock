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

    /**
     * randomly return true or false
     * @param {number} [probability] the probability to return true, must be a value between 0 and 1 (including 0 and 1)
     *
     * @example
     * ```javascript
     * Mock.Random.boolean(0.9) // true
     * ```
     */
    var returnBoolean = function (probability) {
        if (typeof probability === 'undefined') {
            return Math.random() > 0.5;
        }
        return Math.random() > (1 - probability);
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
        min = typeof min !== 'undefined' ? parseInt('' + min, 10) : 0;
        max = typeof max !== 'undefined' ? parseInt('' + max, 10) : 9007199254740992; // 2^53
        return Math.round(Math.random() * (max - min)) + min;
    };
    var Basic = {
        boolean: returnBoolean,
        bool: returnBoolean,
        natural: natural
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
