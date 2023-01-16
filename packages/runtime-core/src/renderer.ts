/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-11 20:25:10
 * @LastEditTime: 2023-01-17 02:12:45
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
    createComment: hostCreateComment,
    nextSibling: hostNextSibling
  } = rendererOptions


  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect，在effect中调用render方法，这样render方法中拿到的数据会收集这个effect，属性更新时会重新执行
    instance.update = effect(function componentEffect(){
      if(!instance.isMounted){
        //初次渲染
        let proxyToUse = instance.proxy;
        //虚拟节点就是subTree
        let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);

        patch(null, subTree,container)
        instance.isMounted = true;
      } else {
        //* diff算法 更新逻辑
        // 我们应该比较两次的subTree
        const prevTree = instance.subTree //上一次的虚拟dom
        let proxyToUse = instance.proxy;
        const nextTree = instance.render.call(proxyToUse, proxyToUse) //新的虚拟dom

        patch(prevTree, nextTree, container) //*对比新旧节点
      }
    }, {
      scheduler: queueJob //这里是做缓存的，只更新一次
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

  const processComponent = (n1, n2, container) => {
    if(n1 === null){ //组件没有上一次的虚拟节点，证明是初渲染
      mountComponent(n2, container)
    } else {
      // 组件更新流程
    }
  }
  const processText = (n1,n2,container) =>{
    if(n1 == null){ // 创建文本插入到容器中
        hostInsert(n2.el = hostCreateText(n2.children),container)
    }
  }
  const processElement = (n1, n2, container, anchor) => {
    if(n1 === null){
      mountElement(n2, container, anchor);
    } else {
      //*元素更新  关于diff算法的
      patchElement(n1,n2,container);
    }
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
        const child = normalizeVNode(children[i]);
        patch(null, child, container)
    }
  }
  const mountElement = (vnode, container, anchor=null) => {
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
    hostInsert(el, container, anchor)
  }

  //* 分割线：上面的几个函数是放在一起共同实现一个功能：用于初始化渲染  凡是 mountXXX 就是初始化渲染. 下面的几个 patchXXX 函数放在一起，是diff算法的-----------------

  const patchProps = (oldProps, newProps,el) => {
    if(oldProps !== newProps){
      for(let key in newProps){
        const prev = oldProps[key];
        const next = newProps[key];
        if(prev !== next){
          hostPatchProp(el, key, prev, next)
        }
      }

      for(const key in oldProps){
        if(!(key in newProps)){
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }

  //* 完整的diff算法
  const patchKeyedChildren = (c1,c2,el) => {
    // Vue3还是对特殊情况进行优化
    
    let i=0; //默认从头开始比对
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    //注意：我们这里的比较不是说选择一种方式进行比较，而是所有方式都会试一次
    //sync from start 从头开始一个一个比，遇到不同的就停止
    while(i <= el && i <= e2){
      const n1 = c1[i];
      const n2 = c2[i];
      if(isSameVNodeType(n1, n2)){
        patch(n1, n2, e1);
      }else{
        break;
      }
      i++;
    }

    // sync from end 从后往前比
    while(i <= el && i <=e2){
      const n1 = c1[e1];
      const n2 = c2[e2];
      if(isSameVNodeType(n1, n2)){
        patch(n1, n2, el)
      }else{
        break;
      }
      e1--;
      e2--;
    }

    //common sequence + mount 比较后，有一方已经完全比对完成，那就剩下的那个要么多余要么缺少，直接插入或删除
    // 前面添加后面添加    前面删除后面删除

    //如果完成后 最终i的值大于e1 说明老的少
    if(i > e1){ //老的少 新的多
      if(i <= e2){ //表示有新增的部分
        while(i <= e2){
          const nextPos = e2 + 1; //找一个参照物，判断是向前追加还是向后追加
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor); //向前或向后追加
          i++;
        }
      }
    } else if(i > e2){ //老的多，新的少
      while(i <= e1){
        unmount(c1[i]);
        i++;
      }
    } else {
      // 该乱序比对了，希望尽可能复用，做成一个映射表
      //Vue3用的新的作为映射表 ，Vue2是用老的
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
          const childVNode = c2[i];
          keyToNewIndexMap.set(childVNode.key, i);
      }

      const toBePatched = e2 - s2 + 1; //个数
      const newIndexToOldIndexMap = new Array(toBePatched)

      //去老的里面查找，看有没有复用的
      for(let i=s1; i<=e1; i++){
        const oldVNode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVNode.key)
        if(newIndex === undefined){ //老的不在新的中
          unmount(oldVNode)
        }else{ //新老比对，比较完毕后位置有差异
          //标记 新的和旧的索引关系
          newIndexToOldIndexMap[newIndex - s2] = i + 1; //标记哪些节点是可以复用的，以此来找到最后需要我们手动插入的节点
          patch(oldVNode,c2[newIndex], el)
        }
      }

      //因为比较完毕后位置有差异，所以最后就是移动节点，并且将新增的节点插入
      for(let i = toBePatched-1; i>=0; i--){
        let currentIndex = i+s2; //找到h的索引
        let child = c2[currentIndex]; //找到h对应的节点
        let anchor = currentIndex+1 < c2.length ? c2[currentIndex+1].el : null;
        // 第一次插入 h 后， h是一个虚拟节点，同时插入后，虚拟节点会拥有真实节点
        if(newIndexToOldIndexMap[i] === 0){ //如果自己是0说明没有被patch过
          patch(null, child.el, anchor)
        }else{
          //这种操作需要将所有节点全部的移动一遍，消耗性能，得优化，希望尽可能的少移动
          // 比如：一串数字，其中有好几个是连续的，并且新旧都是相同的，那么我们希望最好不要移动这些连续且相同的数字
          // 思路：最长递增子序列
          hostInsert(child.el, el, anchor); //操作当前的d,以d下一个作为参照物插入
        }
      }
    }
  }

  const unmountChildren = (children) => {
    for(let i=0; i<children.length; i++){
      unmount(children[i])
    }
  }

  const patchChildren = (n1,n2,el) => {
    const c1 = n1.children
    const c2 = n2.children

    //几种情况：老的有儿子新的没儿子 新的有儿子老的没儿子 新老都有儿子 新老都是文本
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag //分别标识儿子的状况

    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        //老的是n个孩子 但是新的是文本
        if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
          unmountChildren(c1); //如果c1中包含组件会调用组件的销毁方法
        }

        //两个都是文本
        if(c2 !== c1){
          hostSetElementText(el, c2)
        }
    } else {
        // 现在是元素 ，上一次可能是文本或元素
        if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
          if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
            //当前和上一次都是元素，那就是完整的diff算法
            //TODO: 完整的diff算法
            patchKeyedChildren(c1,c2,el)
          } else {
            //一个特殊情况：当前为null
            unmountChildren(c1); //直接删除掉老的
          }
        } else {
          //走到这里说明上一次是文本，当前是元素
          if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
            hostSetElementText(el,'')
          }

          if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){//上一次是文本，当前是元素
            //当前是元素，要把当前元素的所有内容全部进行挂载
            mountChildren(c2, el)
          }
        }
    } 
  }

  const patchElement = (n1,n2,container) => {
    //走到这里说明两个元素是相同节点
    let el = (n2.el = n1.el)

    //更新属性 更新儿子
    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    patchProps(oldProps, newProps,el)
    patchChildren(n1,n2,container)
  }


  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }
  const unmount = (n1) => {
    hostRemove(n1.el)
  }

 //* diff算法 和 初渲染流程
  const patch = (n1,n2,container,anchor=null) => {//anchor是参考节点，告诉我们插入的位置
    //针对不同类型进行初始化操作
    const { shapeFlag, type } = n2

    if(n1 && !isSameVNodeType(n1,n2)){
      // 如果两个节点完全不同，直接替换，不需要diff的比较
      anchor = hostNextSibling(n1.el) //拿到参照物
      unmount(n1); //卸载n1节点
      n1 = null;
      // 问题：如果删除了n1节点，那么我们如何插入n2节点呢？我们可以在删除n1节点之前，
      //拿到n1节点的下一个节点，作为标志，那么我们插入n2节点的时候就知道要往哪里插入了
    }

    switch(type){
      case Text:
        processText(n1,n2,container)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){//证明是元素
          processElement(n1, n2, container, anchor) //处理元素
        } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT){ //证明是组件
          processComponent(n1, n2, container); //处理组件
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