/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-11 20:25:10
 * @LastEditTime: 2023-01-13 05:03:08
 */

import { effect } from "@vue/reactivity"
import { ShapeFlags } from "@vue/shared"
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from "./component"
import { queueJob } from "./scheduler"
import { normalizeVNode } from "./vnode"

// 将组件渲染成dom元素（runtime-core 的核心逻辑），并且这里渲染成dom元素使用的还是 runtime-dom中的api
export function createRenderer(rendererOptions){
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText, 
    createComment: hostCreateComment
  } = rendererOptions


  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect，在effect中调用render方法，这样render方法中拿到的数据会手机这个effect，属性更新时会重新执行
    instance.update = effect(function componentEffect(){
      if(!instance.isMounted){
        //初次渲染
        let proxyToUse = instance.proxy;
        //虚拟节点就是subTree
        let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);

        patch(null, subTree,container)
        instance.isMounted = true;
      } else {
        //更新逻辑
      }
    }, {
      scheduler: queueJob
    })
  }

  const mountComponent = (initalVNode, container) => {
    // 组件渲染流程：最核心的就是调用 setup 拿到返回值，获取render函数返回的结果来进行渲染
    //先有实例，然后根据我们传入的数据(比如setup中的数据，render函数中的数据)，把数据解析到实例上
    //然后创建一个effect 让render函数执行

    const instance = (initalVNode.component = createComponentInstance(initalVNode)) //创建组件实例

    //第二步：将需要的数据解析到实例上
    setupComponent(instance)

    //第三步：创建渲染的effect,让render函数执行
    setupRenderEffect(instance, container)
  }

  const processCompent = (n1, n2, container) => {
    if(n1 === null){ //组件没有上一次的虚拟节点，证明是初渲染
      mountComponent(n2, container)
    } else {
      //组件更新流程
    }
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
        const child = normalizeVNode(children[i]);
        patch(null, child, container)
    }
  }
  const mountElement = (vnode, container) => {
    //递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = (vnode.el = hostCreateElement(type));

    if(props){
      for(const key in props){
        hostPatchProp(el, key, null, props[key])
      }
    }
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
      hostSetElementText(el, children)//文本比较简单：直接扔进去
    }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){ //数组
      mountChildren(children, el)
    }
    hostInsert(el, container)
  }

  const processElement = (n1, n2, container) => {
    if(n1 === null){
      mountElement(n2, container);
    } else {
      //元素更新
    }
  }

  const processText = (n1,n2,container) =>{
    if(n1 == null){ // 创建文本插入到容器中
        hostInsert(n2.el = hostCreateText(n2.children),container)
    }
}

  const patch = (n1,n2,container) => {
    //针对不同类型进行初始化操作
    const { shapeFlag, type } = n2
    switch(type){
      case Text:
        processText(n1,n2,container)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          //证明是元素
          processElement(n1, n2, container) //处理元素
        } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ //证明是组件
          processCompent(n1, n2, container); //处理组件
        }
    }
    
  }

  const render = (vnode, container) => { //参数：虚拟节点和容器
    //core的核心：负责根据虚拟节点和容器来渲染出真实节点

    //默认调用render 可能是初始化流程
    patch(null, vnode, container)
  }

  return {
    createApp: createAppAPI(render)
  }
}