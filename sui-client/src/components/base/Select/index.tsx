import React, { useState, useMemo, useCallback, useEffect, useRef, ChangeEventHandler } from 'react'
import clss from 'classnames'
import './index.scss'

export type Selected = string | number | Array<string | number>
export interface OptProps {
  icon?: string
  label: string | number | JSX.Element
  value: string | number
}
interface Poprs {
  options: Array<OptProps>
  className?: string
  placeholder?: string
  mode?: 'single' | 'multi'
  search?: boolean
  selected?: Selected
  showClear?: boolean
  onChange?: (keys: Selected) => void
  renderOption?: (opt: OptProps) => JSX.Element
}
const Select = (props: Poprs) => {
  const {
    selected,
    mode = 'single',
    search,
    options,
    onChange,
    className,
    placeholder,
    showClear = false,
    renderOption,
  } = props || {}
  const [current, setCurrent] = useState<Array<OptProps>>([])
  const [filterOpt, setFilterOpt] = useState<Array<OptProps>>([])
  const [optState, setOptState] = useState<string>('')
  const [singleInputShow, setSingleInputShow] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const multiSearch = useRef<any>(null)
  const selectRef = useRef<any>(null)

  const isMulti = useMemo(() => mode === 'multi', [mode])
  const isMultiSearch = useMemo(() => mode === 'multi' && search, [mode, search])
  const showEmpty = useMemo(() => {
    return !options.length || (searchText && !options.some(o => o.label.toString().match(searchText)))
  }, [options, searchText])

  const onSelect = useCallback(
    (opt: OptProps) => {
      let newCurrent = []
      if (isMulti) {
        if (!current.some(c => c.value === opt.value)) {
          newCurrent = [...current, opt]
          onChange && onChange(newCurrent.map(c => c.value))
        } else {
          newCurrent = current
        }
      } else {
        newCurrent = [opt]
        onChange && onChange((newCurrent[0] && newCurrent[0].value) || '')
        setSingleInputShow(false)
      }
      setCurrent(newCurrent)
    },
    [options, isMulti, current, onChange],
  )

  useEffect(() => {
    if (selected !== undefined) {
      if (isMulti) {
        if (selected instanceof Array) {
          selected.forEach(s => {
            const t = options.find(o => o.value === s)
            if (t) {
              setCurrent([...current, t])
            }
          })
        } else {
          throw 'in multi mode, selected must be a array'
        }
      } else {
        const t = options.find(o => o.value === selected)
        if (t) {
          setCurrent([t])
        }
      }
    }
  }, [isMulti, options, selected])

  const isActive = useCallback(
    (value: string | number) => {
      return current.some(c => c.value === value) ? 'active' : ''
    },
    [options, current],
  )

  const onSelectBlur = useCallback(() => {
    if (!isMultiSearch) {
      setSingleInputShow(false)
      setTimeout(() => {
        setOptState('hide')
      }, 300)
    }
  }, [singleInputShow, isMultiSearch])

  const onSelectFocus = useCallback(() => {
    if (isMultiSearch && multiSearch) {
      multiSearch.current?.focus()
    } else if (!isMulti && search) {
      setSingleInputShow(true)
    }
    setOptState('show')
  }, [search, isMulti, isMultiSearch, multiSearch])

  const onClear = useCallback(() => {
    setCurrent([])
    onChange && onChange('')
  }, [isMulti, onChange])

  const onClearItem = useCallback(
    (value: string | number) => {
      const newCurrent = current.filter(c => c.value !== value)
      setCurrent(newCurrent)
      onChange && onChange(newCurrent.map(c => c.value))
    },
    [current, onChange],
  )

  const onClickSelect = useCallback(() => {
    if (isMultiSearch && multiSearch) {
      multiSearch.current?.focus()
    } else if (!isMulti && search) {
      setSingleInputShow(true)
    }
    setOptState('show')
    if (mode === 'single' && optState === 'show') {
      setOptState('hide')
      selectRef.current?.blur()
    }
  }, [isMultiSearch, multiSearch, optState, selectRef, mode])

  const onBlurSearch = (e: any) => {
    let newOptState = optState
    if (showEmpty) {
      newOptState = ''
      setOptState(newOptState)
    }
    if (!e?.relatedTarget?.contains(multiSearch.current) || !isMultiSearch) {
      setTimeout(() => {
        newOptState && setOptState('hide')
        setSingleInputShow(false)
        setSearchText('')
        setFilterOpt([])
      }, 250)
    }
  }
  const onFocusSesarch = useCallback(() => {
    setSearchText((current[0] && current[0].label.toString()) || '')
  }, [current, mode, optState])

  const onChangeSearch: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const newSeasrchText = e.target.value
      setSearchText(newSeasrchText)
      const newFilterOpt = options.filter(i => i.label.toString().match(newSeasrchText))
      setFilterOpt(newFilterOpt)
    },
    [options],
  )

  return (
    <div className={clss(className, 'select')}>
      {/* single search */}
      {singleInputShow ? (
        <div className="search-input">
          <input
            type="text"
            value={searchText}
            autoFocus
            onFocus={onFocusSesarch}
            onBlur={onBlurSearch}
            onChange={onChangeSearch}
          />
        </div>
      ) : (
        <div
          className={`select-box ${mode}`}
          tabIndex={-1}
          onBlur={onSelectBlur}
          // onFocus={onSelectFocus}
          onClick={onClickSelect}
          ref={selectRef}>
          {/* selected */}
          {isMulti ? (
            current.map(c => (
              <span className={isMulti ? 'multi-item' : 'value'} key={c.value}>
                {c.label}
                {/* multi clear */}
                {isMulti && <ClearIcon onClick={() => onClearItem(c.value)} className="fill-gray-500 cursor-pointer" />}
              </span>
            ))
          ) : (
            <span className="value" key={current[0]?.value}>
              {current[0]?.label}
            </span>
          )}
          {/* placeholder */}
          {!current.length && !singleInputShow && !searchText && placeholder && (
            <>
              <span className="placeholder font-[500]">{placeholder}</span>
            </>
          )}
          {/* multi search */}
          {isMulti && search && (
            <div className="search-input">
              <input
                tabIndex={0}
                ref={multiSearch}
                value={searchText}
                autoFocus
                onFocus={() => setOptState('show')}
                onBlur={onBlurSearch}
                onChange={onChangeSearch}
              />
            </div>
          )}
        </div>
      )}
      {/* single clear */}
      {current.length && !isMulti && showClear ? (
        <ClearIcon onClick={onClear} className="fill-gray-300 absolute right-[10px] cursor-pointer top-[10px]" />
      ) : (
        <SelectIcon className={clss({ show: optState === 'show' })} />
      )}
      {/* options */}
      <ul className={`select-opt ${optState}`}>
        {/* empty */}
        {showEmpty ? (
          <span className="empty">no data</span>
        ) : (
          (filterOpt.length ? filterOpt : options).map(o => (
            <li className={`opt-item ${isActive(o.value)}`} onClick={() => onSelect(o)} key={o.value}>
              {renderOption ? renderOption(o) : o.label}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

interface ClearProps {
  className: string
  onClick: () => void
}

const ClearIcon = ({ className, onClick }: ClearProps) => {
  return (
    <svg
      height="16"
      width="16"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      className={className}
      onClick={e => {
        e.stopPropagation()
        onClick && onClick()
      }}>
      <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
    </svg>
  )
}

const SelectIcon = ({ className }: { className: string }) => {
  return <div className={clss('select-icon', className)} />
}

export default Select
