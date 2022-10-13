/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 20:14:03
 * @LastEditTime: 2022-10-12 16:24:53
 */

export const isObject = (value) => typeof value == 'object' && value !== null;
export const extend = Object.assign

export const isArray = Array.isArray
export const isFunction = (value) => typeof value == 'function' 
export const isNumber = (value) => typeof value == 'number'
export const isString = (value) => typeof value == 'string'
export const isIntegerKey = (key) => parseInt(key) + '' == key //判断一个属性是不是索引(针对数组)

let hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (target, key) => hasOwnProperty.call(target,key) //判断对象身上有没有这个属性

export const hasChanged = (oldValue,value) => oldValue !== value //判断老值和新值是否一致