/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-13 10:16:50
 * @LastEditTime: 2022-10-13 16:40:54
 */

import { hasChanged, isArray, isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOrTypes } from "./operators";
import { reactive } from "./reactive";

// ref将普通的类型 转化成一个对象，这个对象中有个value属性 指向原来的值
// let name = ref('zf')   name.value
export function ref(value){
  return createRef(value)
}

// ref和reactive的区别：reactive内部采用proxy ref内部使用的是defineProperty

export function shallowRef(value){
  return createRef(value,true)
}

const convert = (val) => isObject(val) ? reactive(val) : val
class RefImpl { //ref返回的是一个RefImpl类的实例
  public _value; //表示声明了一个_value属性，但是没有赋值
  public __v_isRef = true; //产生的实例会被添加 __v_isRef 表示是一个ref属性
  constructor(public rawValue, public shallow){ //参数前面添加修饰符，该属性会被直接放到实例上 可以直接this.xxx获取
    this._value = shallow ? rawValue : convert(rawValue) //如果是深度(出现你在ref中放对象的情况)，需要把里面的都变成响应式的
  }
  //类的属性访问器
  get value(){ //代理 取值取value会帮我们代理到_value上
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }
  set value(newValue){
    if(hasChanged(newValue, this.rawValue)){ //判断新值和老值是否一致
      this.rawValue = newValue;//新值作为老值
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(this, TriggerOrTypes.SET,'value',newValue)
    }
  }
}

function createRef(rawValue, shallow = false){
  return new RefImpl(rawValue, shallow)
}

class ObjectRefImpl{
  public __v_isRef = true;
  constructor(public target, public key){}
  get value(){
    return this.target[this.key]
  }
  set value(newValue){
    this.target[this.key] = newValue
  }
}

export function toRef(target, key){ //可以把一个对象的某属性转化为 ref类型
// 实质上就是将某一个key对应的值转化为ref
/**
 * let state = { name: 'zf' }
 * let ref = toRef(state, 'name')
 */
  return new ObjectRefImpl(target, key)
}

export function toRefs(object){ //object可能是对象/数组
  const ret = isArray(object) ? new Array(object.length) : {}
  for(let key in object){
    ret[key] = toRef(object, key);
  }
  return ret;
}