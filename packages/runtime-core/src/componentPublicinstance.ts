import { hasOwn } from "@vue/shared"

/*
 * @Author: Pan Jingyi
 * @Date: 2023-01-13 03:06:55
 * @LastEditTime: 2023-01-13 03:15:55
 */
export const PublicInstanceProxyHandlers = {
  get({_: instance}, key){
    //取值时 要访问 setUpState, props, data
    const { setupState, props, data } = instance

    if(hasOwn(setupState, key)){
      return setupState[key];
    }else if(hasOwn(props, key)){
      return props[key];
    }else if(hasOwn(data, key)){
      return data[key];
    }else {
      return undefined
    }
  }, 
  set({_: instance}, key, value){
    const { setupState, props, data } = instance

    if(hasOwn(setupState, key)){
      setupState[key] = value;
    }else if(hasOwn(props, key)){
      props[key] = value;
    }else if(hasOwn(data, key)){
      data[key] = value;
    }
    return true;
  }
}