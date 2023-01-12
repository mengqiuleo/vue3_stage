/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 04:24:38
 * @LastEditTime: 2023-01-13 04:29:52
 */
// 1.  只有两个参数  类型 + 孩子  / 类型 + 属性
// 2.  三个参数 最后一个不是数组

import { isObject, isArray } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

// 3.  超过三个 多个参数
export function h(type,propsOrChildren,children){
  const l = arguments.length;
  if(l === 2){
      // 是对象不是数组， 只有一个节点
      if(isObject(propsOrChildren) && !isArray(propsOrChildren)){
          if(isVnode(propsOrChildren)){
              return createVNode(type,null,[propsOrChildren]);
          }
          return createVNode(type,propsOrChildren); // 没有孩子
      }else{
          return createVNode(type, null, propsOrChildren)
      }
  }else{
      if(l > 3){
          children = Array.prototype.slice.call(arguments,2);
      }else if(l === 3 && isVnode(children)){
          children = [children]
      }
      return createVNode(type,propsOrChildren,children)
  }
}