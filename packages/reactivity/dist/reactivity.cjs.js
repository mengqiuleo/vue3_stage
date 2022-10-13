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
const isIntegerKey = (key) => parseInt(key) + '' == key; //判断一个属性是不是索引(针对数组)
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key); //判断对象身上有没有这个属性
const hasChanged = (oldValue, value) => oldValue !== value; //判断老值和新值是否一致

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-12 10:30:07
 * @LastEditTime: 2022-10-13 09:58:59
 */
function effect(fn, options = {}) {
    // 我需要让这个effect变成响应的effect，可以做到effect里面的数据变化：重新执行
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) { //lazy表示这个effect是懒执行，默认的effect会先执行一次
        effect();
    }
    return effect;
}
let uid = 0;
let activeEffect; //一个变量：存储当前属性的effect
const effectStack = []; //栈：effect函数中可能会嵌套effect，那么就需要栈来存储当前属性的effect（区分）
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) { //如果没有再加进去：保证effect没有加入到effectStack中
            //如果出现异常，希望还可以正常的将栈中元素抛出去
            try {
                effectStack.push(effect); //将当前属性的effect入栈
                activeEffect = effect; //存储当前属性的effect
                //让effect上来先执行一次,执行的是我们传入的那个函数: 执行就会去我们设置的变量中取值 
                return fn();
            }
            finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    effect.id = uid++; //制作一个effect标识，用于区分effect
    effect._isEffect = true; //用于标识这个effect是响应式effect
    effect.raw = fn; //保留effect对应的原函数
    effect.options = options; //在effect上保存用户的属性
    return effect;
}
// 让 某个对象中的属性 收集当前它对应的effect函数
const targetMap = new WeakMap();
function track(target, type, key) {
    //这里可以拿到当前属性的effect： activeEffect
    if (activeEffect === undefined) { //该属性不用收集effect
        return;
    }
    /**
     * targetMap代表的是所有对象的集合：里面的key是每一个target，value是这个target的map
     * depsMap代表的是某个target的map：它的value是map，这个map是target的所有属性的集合
     * dep就是从targetMap中根据key(这里的key就是target)，然后拿到对应的depsMap，然后根据key(key就是某个属性)，找到这个属性的set
     * 注意：每个属性对应一个set，然后这个set里面放了它的effect（因为set可以去重，所以是set）
     * 如果这个set里面没有当前的effect，那就加上
     */
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set));
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
    console.log(targetMap);
}
function trigger(target, type, key, newValue, oldValue) {
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
    const depsMap = targetMap.get(target);
    // 如果这个属性没有收集过effect，那就不需要做任何操作：就像我们在effect中写了一个不是reactive的属性并对他做修改，
    if (!depsMap)
        return;
    const effects = new Set();
    // 将所有的要执行的effect 全部存到一个新的集合中，最终一起执行：就是把当前属性所依赖的所有effect存起来
    const add = (effectsToAdd) => {
        if (effectsToAdd) { //effectsToAdd是一个set，里面放了当前属性的所有effect
            effectsToAdd.forEach(effect => effects.add(effect));
        }
    };
    // 1.看修改的是不是数组的长度（因为改长度影响比较大）
    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
            // depsMap对于数组：前几项都是：valueOf, toString, join, length,下面几项是数组的每一项
            // dep：是一个set，上面的depsMap的每一项的value：这个set的值是function reactiveEffect()
            // key：valueOf, toString, join 
            // console.log('depsMap: ',depsMap,'dep: ', dep,'key: ', key)
            if (key === 'length' || key > newValue) {
                // 如果更改的长度 小于收集的索引，那么这个索引也需要触发effect重新执行
                add(dep);
                //dep是一个set，是当前key的所有effect的集合
            }
        });
    }
    else {
        //修改的是对象
        if (key !== undefined) { //这里肯定是修改，不是新增
            add(depsMap.get(key));
        }
        //如果修改数组中的 某一个索引 怎么办？
        switch (type) {
            case 0 /* TriggerOrTypes.ADD */: //这种情况：原来arr:[1,2,3]  但是现在：arr[100]=1
                if (isArray(target) && isIntegerKey(key)) { //如果是数组并且修改的索引大于数组的长度(上面首先判断的是修改索引小于数组长度的情况)
                    add(depsMap.get('length'));
                }
        }
    }
    //取出所有effect，遍历
    effects.forEach((effect) => effect());
}
// { name:'zf', age=12 } => name => [effect effect]

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 21:54:42
 * @LastEditTime: 2022-10-13 09:25:45
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            //收集依赖，等会儿数据变化后更新对应的视图
            //这里相当于属性值的最外面的一层，下面才是如果里层是对象进行递归
            //每个属性都会去走一遍这个函数
            console.log('执行effect时会取值，收集effect');
            track(target, 0 /* TrackOpTypes.GET */, key); //调用get方法时，追踪target对象的key属性
        }
        if (shallow) {
            return res;
        }
        //如果不是浅读并且当前属性值是对象
        if (isObject(res)) {
            //递归：保证属性值里面的对象仍然是响应式的
            // vue2是一上来就递归，vue3是取值时才会代理（懒代理），如果你不用这个值就不会代理
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        // 首先判断是新增还是修改
        const oldValue = target[key]; //获取老的值
        // 判断key是否是数组并且是数组索引，如果是，该索引是已存在的还是新增的，如果不是数组判断该对象的属性key是否存在
        // 这里就对数组和对象进行了区分
        //我们也不需要像vue2那样去重写数组方法：因为push方法也是修改数组索引
        let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        // hadKey 此时就判断出来了该key是新增的还是修改
        const result = Reflect.set(target, key, value, receiver);
        if (!hadKey) {
            //新增
            trigger(target, 0 /* TriggerOrTypes.ADD */, key, value);
        }
        else if (hasChanged(oldValue, value)) { //判断老值和新值是否一致
            //修改
            trigger(target, 1 /* TriggerOrTypes.SET */, key, value);
        }
        // vue2里无法监控更改索引，无法监控数组的长度
        // 当数据更新时，通知对应属性的effect重新执行
        return result;
    };
}
const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
const shallowSet = createSetter(true);
const mutableHandlers = {
    get,
    set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set on key ${key} failed`);
    }
};
const readonlyHandlers = extend({
    get: readonlyGet
}, readonlyObj);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet
}, readonlyObj);

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 21:20:53
 * @LastEditTime: 2022-10-12 10:07:38
 */
function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}
//是不是仅读，是不是深度， 柯里化 new Proxy() 最核心的需要拦截 数据的读取和数据的修改
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
function createReactiveObject(target, isReadonly, baseHandlers) {
    //如果目标不是对象，没法拦截， reactive这个api只能拦截对象类型
    if (!isObject(target)) {
        return target;
    }
    // 如果某个对象已经被代理过了 就不要再次代理了
    // 可能一个对象 被深度代理了 又是仅读代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existProxy = proxyMap.get(target);
    if (existProxy) {
        return existProxy; //如果已经被代理了，直接返回即可
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy); //将要代理的对象 和 对应代理结果缓存起来
    return proxy;
}

/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-13 10:16:50
 * @LastEditTime: 2022-10-13 10:32:23
 */
// ref将普通的类型 转化成一个对象，这个对象中有个value属性 指向原来的值
// let name = ref('zf')   name.value
function ref(value) {
    return createRef(value);
}
// ref和reactive的区别：reactive内部采用proxy ref内部使用的是defineProperty
function shallowRef(value) {
    return createRef(value, true);
}
class RefImpl {
    rawValue;
    shallow;
    _value; //表示声明了一个_value属性，但是没有赋值
    __v_isRef = true; //产生的实例会被添加 __v_isRef 表示是一个ref属性
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
    }
}
function createRef(rawValue, shallow = false) {
    return new RefImpl(rawValue, shallow);
}

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
//# sourceMappingURL=reactivity.cjs.js.map
