/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 20:36:13
 * @LastEditTime: 2022-10-11 20:44:32
 */
//把package 目录下的所有包都进行打包

const fs = require('fs');
const execa = require('execa')

const targets = fs.readdirSync('package').filter(f => {
  if(!fs.statSync(`packages/${f}`).isDirectory()){
    return false;
  }
  return true;
})

// 对我们目标进行依次打包，并行打包

async function build(target) {
  await execa(
      'rollup',
      [
          '-c',
          '--environment',
          `TARGET:${target}`
      ], 
      { stdio: 'inherit' }
  )
}

function runParallel(targets, iteratorFn){
  const res = []
  for(const item of targets){
    const p = iteratorFn(item)
    res.push(p)
  }
  return Promise.all(res)
}

runParallel(targets, build)