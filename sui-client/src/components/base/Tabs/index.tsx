import RCTabs, { TabPane } from 'rc-tabs'
import './index.scss'

export type TabsProp = {
  defaultKey: string
  tabs: Array<{ key: string; label: string; extra?: string; renderKey?: JSX.Element; render: () => JSX.Element }>
  callback?: (key: string) => void
}

const Tabs = ({ callback, tabs, defaultKey }: TabsProp) => {
  return (
    <div className="tabs">
      <RCTabs prefixCls="ex" className="w-[100%]" activeKey={defaultKey} onChange={callback}>
        {tabs.map(tab => (
          <TabPane tab={tab.renderKey || tab.label || tab.key + tab.extra} key={tab.key}>
            {tab.render()}
          </TabPane>
        ))}
      </RCTabs>
    </div>
  )
}
export default Tabs
