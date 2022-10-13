/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 21:54:42
 * @LastEditTime: 2022-10-13 20:55:45
 */
// 是不是仅读的 仅读的属性set时会报异常
// 是不是深度的

import { extend, hasOwn, isIntegerKey, isObject, isArray, hasChanged } from '@vue/shared/src'
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOrTypes } from './operators';
import { reactive, readonly } from "./reactive";

function createGetter(isReadonly = false, shallow = false){ //拦截获取功能
  return function get(target, key, receiver){ //receiver是代理对象本身，一般用不到
    
    const res = Reflect.get(target, key, receiver)

    if(!isReadonly){
      //收集依赖，等会儿数据变化后更新对应的视图
      //这里相当于属性值的最外面的一层，下面才是如果里层是对象进行递归
    
      //每个属性都会去走一遍这个函数
      console.log('执行effect时会取值，收集effect')
      track(target, TrackOpTypes.GET, key) //调用get方法时，追踪target对象的key属性，追踪该属性就是进行依赖收集
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
    // 首先判断是新增还是修改
    const oldValue = target[key]; //获取老的值

    // 判断key是否是数组并且是数组索引，如果是，该索引是已存在的还是新增的，如果不是数组判断该对象的属性key是否存在
    // 这里就对数组和对象进行了区分
    //我们也不需要像vue2那样去重写数组方法：因为push方法也是修改数组索引
    let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target,key)
    // hadKey 此时就判断出来了该key是新增的还是修改

    const result = Reflect.set(target, key, value, receiver)

    if(!hadKey){
      //新增
      trigger(target, TriggerOrTypes.ADD, key, value)//在trigger中就会执行该属性的effect
    }else if(hasChanged(oldValue,value)){//判断老值和新值是否一致
      //修改
      trigger(target, TriggerOrTypes.SET, key, value, oldValue)
    }

    // vue2里无法监控更改索引，无法监控数组的长度
    // 当数据更新时，通知对应属性的effect重新执行
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