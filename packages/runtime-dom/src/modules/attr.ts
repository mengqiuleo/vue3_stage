/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:39:05
 * @LastEditTime: 2023-01-12 02:52:17
 */
export const patchAttr = (el, key, value) => {
  if(value === null){
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}