import React from 'react'
import './index.scss'

interface Option {
  imgSrc: string
  desc: string
  id: string
}

interface WalletSelectProps {
  title: string
  options: Option[]
  handleClick: (id: string) => void
}

const WalletSelect: React.FC<WalletSelectProps> = ({ title, options, handleClick }) => {
  return (
    <div className="wallet-select">
      <h1 className="title">{title}</h1>
      <div className="options">
        {options.map((option, index) => (
          <div className="option" key={option.id} onClick={() => handleClick(option.id)}>
            <img className="img" src={`/img/${option.imgSrc}`} alt={option.desc} />
            <p className="desc">{option.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WalletSelect
