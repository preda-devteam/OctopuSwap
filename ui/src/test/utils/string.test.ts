import { filterEmptyParams } from '@/utils'

describe('filter empty params', () => {
  it('test with {a: undefined}', () => {
    const obj = filterEmptyParams({ a: undefined })
    expect(Object.keys(obj).length).toEqual(0)
  })
})
