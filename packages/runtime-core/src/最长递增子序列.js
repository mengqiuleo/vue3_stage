/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-14 02:03:59
 * @LastEditTime: 2023-01-14 02:12:13
 */
const arr = [1,8,5,3,4,9,7,6,0]

function getSequence(arr){
  const len = arr.length
  const result = [0] //存放所有索引，先把第一个数的索引放进去，作为参照物
  let start, end, middle;
  for(let i=0; i<len; i++){
    const arrI = arr[i];
    if(arrI !== 0){ //这里不对0处理是针对diff算法，如果为0，表示这个为h,不属于连续的数，h是要单独插入的数
      let resultLastIndex = result[result.length - 1]
      if(arr[resultLastIndex] < arrI){
        result.push(i)
        continue
      }

      //二分查找，找到比当前值大的哪一个
      start = 0;
      end = result.length - 1; // 二分查找 前后索引
      while (start < end) { // 最终start = end 
          middle = ((start + end) / 2) | 0;
          // 拿result中间值合  最后一项比较
          if (arr[result[middle]] < arrI) { // 找比arrI大的值 或者等于arrI
              start = middle + 1;
          } else {
              end = middle;
          }
      }
      if (arrI < arr[result[start]]) {
          result[start] = i; // 用更有潜力的来替换
      }
    }
    let len = result.length
    let last = result[len - 1]
    while (start-- > 0) { // 倒序追溯
        result[start] = last
        last = p[last]
    }
  } 
  return result
}