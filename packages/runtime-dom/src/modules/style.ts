/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-12 02:39:27
 * @LastEditTime: 2023-01-12 02:51:00
 */
export const patchStyle = (el, prev, next) => {
  const style = el.style; //获取样式
  if(next === null){
    el.removeAttribute('style') //新的没有样式，直接全部删除
  } else {
    //老的里有，新的没有
    if(prev){
      for(let key in prev){
        if(next[key] === null){
          style[key] = ''
        }
      }
    }

    //新的里面需要加上
    for(let key in next){
      style[key] = next[key]
    }
  }
}