/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 01:07:42
 * @LastEditTime: 2023-01-16 05:06:55
 */
import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";

/**
 * createVNode 创建虚拟节点
 */

export function isVnode(vnode){
  return vnode.__v_isVnode
}

// 创建虚拟节点可能是一个元素，或者是一个组件，比如一个组件：createApp(App, {})，原生dom中根本没有App这个元素，而我们这里的App是我们自定义的组件
export const createVNode = (type, props, children = null) => {
  // 可以根据type来区分是组件还是普通元素
  // 用什么区分？ 组件是对象，元素是字符串
  const shapeFlag = isString(type) ? 
    ShapeFlags.ELEMENT : isObject(type) ?
      ShapeFlags.STATEFUL_COMPONENT : 0

  //给虚拟节点加一个类型
  const vnode = { //用一个对象描述对应的内容
    __v_isVnode: true, //表示它是一个虚拟节点
    type,
    props,
    children,
    component: null, //存放组件对应的实例
    el:null, //el用来将虚拟节点和真实节点对应起来
    key: props && props.key, //diff算法用到的key
    shapeFlag //用来区分是组件还是元素, 描述自己的类型(这里其实是将自己和儿子的类型做了联合，用的是下面的normalizeChildren函数)
  }
  normalizeChildren(vnode, children) //将自己和儿子的类型进行联合

  return vnode;
}

function normalizeChildren(vnode, children){ //判断节点的儿子的类型
  let type = 0;
  if(children == null){ //不对儿子进行处理
  
  } else if(isArray(children)){
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type
}

export const Text = Symbol('Text')
export function normalizeVNode(child) { // 对节点进行标识
    if(isObject(child)){
        return child
    }
    return createVNode(Text,null,String(child));
}