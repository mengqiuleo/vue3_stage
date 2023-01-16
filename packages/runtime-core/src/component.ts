/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 02:27:12
 * @LastEditTime: 2023-01-17 00:56:15
 */
// 组件中所有的方法

import { isFunction, isObject, ShapeFlags } from "@vue/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicinstance";

export function createComponentInstance(vnode){ //创建组件实例
  const instance = { //组件的实例
    vnode,
    type: vnode.type,
    props: {}, //我们接收的属性
    attrs: {}, //我们自身原本就有的属性
    slots: {},
    ctx: {},
    setupState: {}, //如果setup返回一个对象，这个对象就是setupState
    render: null,
    isMounted: false //表示这个组件是否被挂载过
  }
  instance.ctx = {_: instance}
  return instance;
}

export function setupComponent(instance){ //解析实例上的数据，将数据挂载到实例上去
  // instance 其实就是我们的虚拟节点vnode（我们可以在vnode.ts中看到他们的属性）

  const {props, children} = instance.vnode;
  //根据props 解析出 props 和 attrs ，将其方法哦instance上
  instance.props = props;
  instance.children = children;

  //需要先看一下当前组件是不是有状态的组件，函数组件
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if(isStateful){ //表示现在是一个带状态的组件
    //调用 当前实例的setup方法，用setup的返回值 填充setupState和对应的render方法
    setupStatefulComponent(instance)
  }

}

//* 这个文件没咋看懂，是一坨狗屎吗 艹
function setupStatefulComponent(instance) {
  // 第一步：代理 传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  //第二步：获取组件的类型，拿到组件的setup方法
  let Component = instance.type
  let {setup} = Component
  let setupContext = createSetupContext(instance)
  //-------没有setup 没有render?----------
  if(setup){
    let setupContext = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContext);

    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance); //完成组件的启动
  }
}

function handleSetupResult(instance, setupResult){
  if(isFunction(setupResult)){
    instance.render = setupResult
  } else if(isObject(setupResult)){
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance){
  let Component = instance.type
  if(!instance.render){
    //对template模板进行编译 产生render函数
    //instance.render = render; //需要将生成render函数放在实例身上

    if(!Component.render && Component.template){
      //编译 将结果 赋给 Component.render
    }
    instance.render = Component.render;
  }
  //接下来是对vue2的api进行兼容处理
}

function createSetupContext(instance){
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

//instance 表示的组件的状态，各种各样的状态，组件的相关信息
// context 有4个参数 为了方便开发时使用的
// proxy 主要为了取值方便 -> proxy.xxxx