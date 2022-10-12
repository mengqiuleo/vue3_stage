/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 21:54:42
 * @LastEditTime: 2022-10-12 10:22:26
 */
// 是不是仅读的 仅读的属性set时会报异常
// 是不是深度的

import { extend, isObject } from '@vue/shared/src'
import { reactive, readonly } from "./reactive";

function createGetter(isReadonly = false, shallow = false){ //拦截获取功能
  return function get(target, key, receiver){
    
    const res = Reflect.get(target, key, receiver)

    if(!isReadonly){
      //收集依赖，等会儿数据变化后更新对应的视图
      //这里相当于属性值的最外面的一层，下面才是如果里层是对象进行递归
    }

    if(shallow){
      return res
    }
    //如果不是浅读并且当前属性值是对象
    if(isObject(res)){
      //递归：保证属性值里面的对象仍然是响应式的
      // vue2是一上来就递归，vue3是取值时才会代理（懒代理），如果你不用这个值就不会代理
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

function createSetter(shallow = false){ //拦截设置功能
  return function set(target, key, value, receiver){
    const result = Reflect.set(target, key, value, receiver)

    return result
  }
}

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

export const mutableHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set on key ${key} failed`)
  }
}

export const readonlyHandlers = extend({
  get: readonlyGet
}, readonlyObj)

export const shallowReadonlyHandlers = extend({
  get: shallowReadonlyGet
}, readonlyObj)