/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:27:02
 * @LastEditTime: 2023-01-12 02:34:11
 */
export const nodeOps = {
  // createElement, 不同的平台创建元素方式不同

  createElement: tagName => document.createElement(tagName), //增加
  remove: child => { //删除
    const parent = child.parentNode;
    if(parent) {
      parent.removeChild(child);
    }
  },
  insert: (child, parent, anchor = null) => { //插入
    parent.insertBefore(child, anchor); // 如果参照物为空，相当于appendChild
  },
  querySelector: selector => document.querySelector(selector),
  setElementText: (el, text) => el.textContent = text, //设置元素内容

  //文本操作，创建文本，设置文本内容
  createText: text => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text
}