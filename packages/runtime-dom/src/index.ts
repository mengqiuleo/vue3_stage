/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-11 20:25:26
 * @LastEditTime: 2023-01-16 04:07:05
 */
/**
 * runtime-dom 核心就是：提供domAPI方法
 * 操作节点、操作属性的更新
 * 
 * 节点操作：增删改查
 * 属性操作：添加 删除 更新 (样式、类、事件、其他属性)
 */

import { createRenderer } from '@vue/runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps' //对象
import { patchProp } from './patchProp' //方法

//渲染时用到的所有方法
const rendererOptions = extend({patchProp}, nodeOps)



export function createApp(rootComponent, rootProps = null) {
  //createApp 返回的是一个app对象，然后这个app对象上有mount方法

  // createRender函数是 core的核心逻辑，为了将组件渲染成dom元素，具体代码在core的index.ts中
  //我们最好把这两部分放在一起看，更好理解，当时写代码的时候就是先把createRender函数放在这写，然后抽离出去的
  //createRender函数中用的还是runtime-dom的api，所以我们要把rendererOptions传过去
  const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps)

  let { mount } = app; //这里拿到渲染成dom元素中的mount, 下面对这个mount进行重写(重写其实就是为了消除app根元素中无用的属性、方法...)
  app.mount = function(container){
    //清空容器的操作：就是对于我们挂载的app的那个div，它里面放的所有东西都是无用的
    container = nodeOps.querySelector(container); 
    container.innerHTML = '';

    mount(container)
    //第二步：将组件渲染成dom元素，进行挂载
    //这一步功能的实现，我们要放到 runtime-core中去，因为runtime-dom只是负责解决平台差异，
    //真正核心的部分是将组件渲染成动漫元素，而渲染成dom元素是所有框架都会干的事情
    // runtime-core 的核心渲染逻辑是 createRenderer() 函数
  }
  return app;
}

export * from '@vue/runtime-core'

/**
 * 为什么把 runtime-dom 和 runtime-core 分开？
 * 主要是把dom层面的操作 和 逻辑层面的操作分开，我们这里可以看到，在runtime-dom层面我们就使用了dom操作
 * runtime-core虽然也用了，但是我们是把这些api当做参数传给了core层面
 */

// 用户调用的是 runtime-dom  runtime-dom调用的是runtime-core
// runtime-dom是为了解决平台差异



/*
使用案例
<div id='app'>123<div/>

let { createApp } = VueRuntimeDOM;
let App = {
  render(){
    console.log('render')
  }
}
createApp(App, {name:'zf', age:12}).mount('#app')
*/
/**
 * 在 VueRuntimeDOM 中就会有我们创建的事件、属性、类等方法
 * VueRuntimeDOM 是一个对象：{rendererOptions: {...}, __esModule: true}
 * 然后展开 rendererOptions, 里面是我们创建的方法
 * rendererOptions: {patchProp: f, createElement: f, remove: f, insert: f, querySelector: f, ...}
 * 然后根据使用案例来看：我们要自己实现 createApp 方法，它有两个参数：要挂载的组件，相关的属性
 */