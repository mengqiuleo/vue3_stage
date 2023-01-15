/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 00:56:41
 * @LastEditTime: 2023-01-16 04:55:35
 */
import { createVNode } from "./vnode"

export function createAppAPI(render){
  return function createApp(rootComponent, rootProps){ //告诉他那个组件那个属性来创建应用，它有两个参数：要挂载的组件，相关的属性
    const app = {
      //存储一些私有属性
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) { //挂载的目的地，比如app根元素
        //第一步：根据组件创建虚拟节点： let vnode = {}; 
        //第二步：将虚拟节点和容器获取到后调用render函数进行渲染：  render(vnode, container);

        //第一步：创建虚拟节点
        const vnode = createVNode(rootComponent, rootProps)

        //调用render：将虚拟节点和container共同创建出真实dom元素
        render(vnode, container)


        app._container = container
      },
    }
    return app;
  }
}