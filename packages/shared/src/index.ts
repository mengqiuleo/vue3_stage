/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 20:14:03
 * @LastEditTime: 2022-10-11 22:03:10
 */

export const isObject = (value) => typeof value == 'object' && value !== null;
export const extend = Object.assign