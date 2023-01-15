/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:39:19
 * @LastEditTime: 2023-01-16 04:02:40
 */
export const patchEvents = (el, key, nextValue) => {
  const invokers = el._vei || (el._vei = {}); //把这些事件放到一个对象中，作为缓存，只有当成为缓存时后面才能去删除这些事件，并且这个对象作为el的属性
  const existingInvoker = invokers[key]; // 是否缓存过

  if (nextValue && existingInvoker) { //如果有缓存而且有新值，更新函数
      existingInvoker.value = nextValue;
  } else {
      const name = key.slice(2).toLowerCase(); // 转化事件是小写的，拿到事件名
      if (nextValue) {// 存在新的缓存函数，但是没有绑定过
          const invoker = (invokers[key]) = createInvoker(nextValue);
          el.addEventListener(name, invoker);
      } else if (existingInvoker) { // 有缓存的变量，但是现在没有需要绑定的函数，
          el.removeEventListener(name, existingInvoker); //移除这个缓存函数
          invokers[key] = undefined
      }
  }
}

function createInvoker(initialValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = initialValue;
  return invoker;
}