/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:34:47
 * @LastEditTime: 2023-01-13 04:43:15
 */
import { patchAttr } from "./modules/attr"
import { patchClass } from "./modules/class"
import { patchEvents } from "./modules/events"
import { patchStyle } from "./modules/style"

export const patchProp = (el, key, prevValue, nextValue) => {
  switch(key){
    case 'class':
      patchClass(el, nextValue); //比对属性
      break;
    case 'style':
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      //如果不是事件 才是属性
      if(/^on[^a-z]/){ //先对key进行正则匹配，判断是否是事件
        patchEvents(el, key, nextValue); //事件就是添加和删除 修改
      } else {
        patchAttr(el, key, nextValue);
      }
  }
}