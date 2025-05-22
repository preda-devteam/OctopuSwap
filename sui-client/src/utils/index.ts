/**
 * 过滤对象中无值的属性
 * @param params 对象
 * @returns newparams
 */
export const filterEmptyParams = (params: { [propName: string]: any } | undefined) => {
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(key => {
      const val = params[key]
      if (['', undefined, null].includes(val)) {
        delete params[key]
      }
    })
    return params
  }
  return params
}
