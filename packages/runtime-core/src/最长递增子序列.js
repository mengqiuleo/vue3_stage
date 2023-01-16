/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-14 02:03:59
 * @LastEditTime: 2023-01-17 04:24:48
 */
const arr = [1,8,5,3,4,9,7,6,2] //1 3 4 9 
//实现: 贪心 + 二分查找

/**
 * 具体实现：
 * 1
 * 1 8
 * 1 5
 * 1 3
 * 1 3 4 
 * 1 3 4 9
 * 1 3 4 7
 * 1 3 4 6
 * 1 2 4 6 虽然这一项是错误的，但是它的个数是正确的
 */

/**
 * 思路：
 * 1. 在查找原数组中，如果原数组当前的这一项比我们求出来的序列的最后一项大，直接插入
 * 2. 如果原数组当前的这一项比我们求出来的序列的最后一项小，采用二分查找，在求得的序列中找到第一个大的数，并且替换
 *    eg: 上面的例子中，我们本来是1 3 4 6，但是原数组中下一项是2，那么就在求得的数组中，找到比2大的第一个数，并且替换
 *        那么就是 1 3 4 6 替换成了 1 2 4 6
 * 3. 到这里，我们求出来的最长递增子序列的个数是正确的，但是答案是错误的，我们还会进一步优化的
 */

function getSequence(arr){
  const len = arr.length
  const result = [0] //作为结果集，也就是我们最后求出来的结果序列，result存放所有索引，先把第一个数的索引放进去，作为参照物
  const p = arr.slice(0); // 里面内容无所谓 和 原本的数组相同 用来存放索引
  let start, end, middle;
  for(let i=0; i<len; i++){
    const arrI = arr[i];
    if(arrI !== 0){ //这里不对0处理是针对diff算法，如果为0，表示这个为h,不属于连续的数，h是要单独插入的数
      let resultLastIndex = result[result.length - 1] //拿到结果集的最后一项的索引
      if(arr[resultLastIndex] < arrI){ //如果我们遍历到的当前数比结果集最后的数小，那么就直接把原数组的这个数插入
        //* 在放入结果集之前，还要让它记住自己的前一个节点
        p[i] = result[result.length - 1]
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
        if(start > 0){ //才需要替换
          p[i] = result[start - 1]; //要将它替换的前一个记住
        }
        result[start] = i; // 用更有潜力的来替换
      }
    }
  } 
  let i = result.length // 总长度
  let last = result[i - 1] // 找到了最后一项
  while (i-- > 0) { // 根据前驱节点一个个向前查找
    result[i] = last // 最后一项肯定是正确的
    last = p[last]
  }
  return result;
}