/*
 * @Author: Pan Jingyi
 * @Date: 2022-10-11 20:36:13
 * @LastEditTime: 2023-01-11 20:34:34
 */
//把package 目录下的所有包都进行打包

const fs = require('fs');
const execa = require('execa')

const target = 'runtime-dom'

// 对我们目标进行依次打包，并行打包
build(target)
async function build(target) {
  await execa(
      'rollup',
      [
          '-cw',
          '--environment',
          `TARGET:${target}`
      ], 
      { stdio: 'inherit' }
  )
}

