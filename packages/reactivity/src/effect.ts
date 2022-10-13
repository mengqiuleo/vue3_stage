import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOrTypes } from "./operators";

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-12 10:30:07
 * @LastEditTime: 2022-10-13 16:21:44
 */
export function effect(fn, options:any = {}){
  // 我需要让这个effect变成响应的effect，可以做到effect里面的数据变化：重新执行

  const effect = createReactiveEffect(fn, options);

  if(!options.lazy){ //lazy表示这个effect是懒执行，默认的effect会先执行一次
    effect();
  }

  return effect;
}

let uid  = 0;
let activeEffect;//一个变量：存储当前属性的effect
const effectStack = []; //栈：effect函数中可能会嵌套effect，那么就需要栈来存储当前属性的effect（区分）
function createReactiveEffect(fn, options){ //fn就是用户传入的函数
  const effect = function reactiveEffect(){
    if(!effectStack.includes(effect)){ //如果没有再加进去：保证effect没有加入到effectStack中
      //如果出现异常，希望还可以正常的将栈中元素抛出去
      try{
        effectStack.push(effect); //将当前属性的effect入栈
        activeEffect = effect; //存储当前属性的effect
        //让effect上来先执行一次,执行的是我们传入的那个函数: 执行就会去我们设置的变量中取值 
        return fn();
      }finally{
        effectStack.pop();
        activeEffect = effectStack[effectStack.length-1]
      }
    }
    
  }
  effect.id = uid++; //制作一个effect标识，用于区分effect
  effect._isEffect = true; //用于标识这个effect是响应式effect
  effect.raw = fn; //保留effect对应的原函数
  effect.options = options; //在effect上保存用户的属性

  return effect;
}

// 让 某个对象中的属性 收集当前它对应的effect函数
const targetMap = new WeakMap()
export function track(target, type, key){
  //这里可以拿到当前属性的effect： activeEffect

  if(activeEffect === undefined){ //该属性不用收集effect
    return;
  }

  /**
   * targetMap代表的是所有对象的集合：里面的key是每一个target，value是这个target的map
   * depsMap代表的是某个target的map：它的value是map，这个map是target的所有属性的集合
   * dep就是从targetMap中根据key(这里的key就是target)，然后拿到对应的depsMap，然后根据key(key就是某个属性)，找到这个属性的set
   * 注意：每个属性对应一个set，然后这个set里面放了它的effect（因为set可以去重，所以是set）
   * 如果这个set里面没有当前的effect，那就加上
   */
  let depsMap = targetMap.get(target)
  if(!depsMap){
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if(!dep){
    depsMap.set(key, (dep = new Set))
  }
  if(!dep.has(activeEffect)){
    dep.add(activeEffect)
  }

  console.log('targetMap: ',targetMap)
}

export function trigger(target, type, key?, newValue?, oldValue?){
  // target：我们代理的整个对象  type: 0/1 -> 新增/修改   key: 新增或修改的属性
  // console.log('执行set或add',type, key, newValue, oldValue)
  
  /**
   * targetMap是整个对象(即：let obj = reactive({name:'zs', age:12, arr: [1,2,3]}) )
   * 那么 targetMap 就是 {name:'zs', age:12, arr: [1,2,3]}
   * 
   * 这里的传参的target比如是：arr
   * 那么depsMap就是[1,2,3]，但其实浏览器会自动加上一些方法：valueOf, toString, join, length，然后才是每一项：1,2,3
   * 对于depsMap来说：它也有key和value：
   * key就是valueOf, toString, join, length，每一项... 
   * value是一个set：这个set的值是function reactiveEffect()，对于function reactiveEffect()，这个函数的返回值是一个effect
   * 也就是说，对于每个key(valueOf, toString, join, length，每一项... ),它的值是一个set，里面是它的effect
   * 因为一个属性可能有好几个effect，所以用set
   */
  const depsMap = targetMap.get(target)
  // 如果这个属性没有收集过effect，那就不需要做任何操作：就像我们在effect中写了一个不是reactive的属性并对他做修改，
  if(!depsMap) return;

  const effects = new Set()
  // 将所有的要执行的effect 全部存到一个新的集合中，最终一起执行：就是把当前属性所依赖的所有effect存起来
  const add = (effectsToAdd) => {
    if(effectsToAdd){ //effectsToAdd是一个set，里面放了当前属性的所有effect
      effectsToAdd.forEach(effect => effects.add(effect))
    }
  }

  // 1.看修改的是不是数组的长度（因为改长度影响比较大）
  if(key === 'length' && isArray(target)){
    depsMap.forEach((dep, key) => {
      // depsMap对于数组：前几项都是：valueOf, toString, join, length,下面几项是数组的每一项
      // dep：是一个set，上面的depsMap的每一项的value：这个set的值是function reactiveEffect()
      // key：valueOf, toString, join 
      // console.log('depsMap: ',depsMap,'dep: ', dep,'key: ', key)

      if(key === 'length' || key > newValue){
        // 如果更改的长度 小于收集的索引，那么这个索引也需要触发effect重新执行
        add(dep);
        //dep是一个set，是当前key的所有effect的集合
      }
    })
  } else {
    //修改的是对象
    if(key !== undefined){ //这里肯定是修改，不是新增
      add(depsMap.get(key))
    }
    //如果修改数组中的 某一个索引 怎么办？
    switch(type){
      case TriggerOrTypes.ADD: //这种情况：原来arr:[1,2,3]  但是现在：arr[100]=1
        if(isArray(target) && isIntegerKey(key)){ //如果是数组并且修改的索引大于数组的长度(上面首先判断的是修改索引小于数组长度的情况)
          add(depsMap.get('length'))
        }
    }
  }

  //取出所有effect，遍历
  effects.forEach((effect:any) => effect())
}

// { name:'zf', age=12 } => name => [effect effect]