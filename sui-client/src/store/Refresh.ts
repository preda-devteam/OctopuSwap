import { action, observable, makeObservable } from 'mobx'

class RefreshStore {
  constructor() {
    makeObservable(this)
  }
  @observable refresh = false

  @action setRefresh = (r: boolean) => {
    this.refresh = r
    setTimeout(() => {
      this.refresh = false
    })
  }
}

export default new RefreshStore()
