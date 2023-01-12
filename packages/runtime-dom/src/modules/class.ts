/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:39:10
 * @LastEditTime: 2023-01-12 02:43:59
 */
export const patchClass = (el, value) => {
  if(value === null){
    value = '';
  }
  el.className = value
}