/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 05:00:48
 * @LastEditTime: 2023-01-13 05:09:25
 */
let queue = [];

export function queueJob(job){
  if(!queue.includes(job)){
    queue.push(job);
    queueFlush();
  }
}

let isFlushPending = false;//判断是否正在更新
function queueFlush(){
  if(!isFlushPending){
    isFlushPending = true;
    Promise.resolve().then(flushJobs)
  }
}

function flushJobs(){
  isFlushPending = false

  //清空时，需要根据调用的顺序依次刷新，保证先刷新父再刷新子
  queue.sort((a,b) => a.id - b.id)
  for(let i=0; i<queue.length; i++){
    const job = queue[i];
    job()
  }
  queue.length = 0;
}