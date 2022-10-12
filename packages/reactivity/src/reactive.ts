/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 21:20:53
 * @LastEditTime: 2022-10-12 10:07:38
 */

import { isObject } from '@vue/shared/src'

import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'


export function reactive(target){
  return createReactiveObject(target, false, mutableHandlers)
}

export function shallowReactive(target){
  return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly(target){
  return createReactiveObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target){
  return createReactiveObject(target, true, shallowReadonlyHandlers)
}

//是不是仅读，是不是深度， 柯里化 new Proxy() 最核心的需要拦截 数据的读取和数据的修改

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()

export function createReactiveObject(target, isReadonly, baseHandlers){
  //如果目标不是对象，没法拦截， reactive这个api只能拦截对象类型
  if(!isObject(target)){
    return target;
  }

  // 如果某个对象已经被代理过了 就不要再次代理了
  // 可能一个对象 被深度代理了 又是仅读代理
  const proxyMap = isReadonly? readonlyMap : reactiveMap; 

  const existProxy = proxyMap.get(target)
  if(existProxy){
    return existProxy; //如果已经被代理了，直接返回即可
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy) //将要代理的对象 和 对应代理结果缓存起来

  return proxy
}