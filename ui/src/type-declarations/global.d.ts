interface KV<T> {
  [props: string]: T
}

type ValueOf<T> = T[keyof T]

type CustomPage<P = Record<string, unknown>> = React.ComponentType<P> & {
  getLayout?: (page: NextPage) => JSX.Element
  getInitialProps?: (context: NextPageContext) => Promise<Record<string, unknown>>
}

interface CommonResponse<T> {
  code: number
  message: string
  data?: T
}

interface StyleComponent<T = string> {
  className?: T
  style?: React.CSSProperties
}

declare module '*.csv' {
  const value: any
  export default value
}

interface Window {
  net?: string
  langsBook: any
  ethereum: any
  base32?: {
    decode: (str: string) => string
    encode: (str: string) => string
  }
}

interface DynamodbResponse<T> {
  Content: T
  Hash: string
}

interface RequestPageParams {
  pos: number
  limit: number
}
