var VueReactivity = (function (exports) {
  'use strict';

  /*
   * @Author: Pan Jingyi
   * @Date: 2022-10-11 20:14:03
   * @LastEditTime: 2022-10-11 22:03:10
   */
  const isObject = (value) => typeof value == 'object' && value !== null;
  const extend = Object.assign;

  /*
   * @Author: Pan Jingyi
   * @Date: 2022-10-11 21:54:42
   * @LastEditTime: 2022-10-11 22:18:53
   */
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver);
          if (shallow) {
              return res;
          }
          if (isObject(res)) {
              return isReadonly ? readonly(res) : reactive(res);
          }
          return res;
      };
  }
  function createSetter(shallow = false) {
      return function set(target, key, value, receiver) {
          const result = Reflect.set(target, key, value, receiver);
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
   * @LastEditTime: 2022-10-11 22:17:55
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
      const proxyMap = isReadonly ? reactiveMap : readonlyMap;
      const existProxy = proxyMap.get(target);
      if (existProxy) {
          return existProxy; //如果已经被代理了，直接返回即可
      }
      const proxy = new Proxy(target, baseHandlers);
      proxyMap.set(target, proxy); //将要代理的对象 和 对应代理结果缓存起来
      return proxy;
  }

  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
