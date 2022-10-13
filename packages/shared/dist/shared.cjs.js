'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 20:14:03
 * @LastEditTime: 2022-10-12 16:24:53
 */
const isObject = (value) => typeof value == 'object' && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value == 'function';
const isNumber = (value) => typeof value == 'number';
const isString = (value) => typeof value == 'string';
const isIntegerKey = (key) => parseInt(key) + '' == key; //判断一个属性是不是索引(针对数组)
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key); //判断对象身上有没有这个属性
const hasChanged = (oldValue, value) => oldValue !== value; //判断老值和新值是否一致

exports.extend = extend;
exports.hasChanged = hasChanged;
exports.hasOwn = hasOwn;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isIntegerKey = isIntegerKey;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
//# sourceMappingURL=shared.cjs.js.map
