import React from 'react'
import './page.scss'
import Top1s from '@/components/combined/RankTable/Top1s'
import TopPopulars from '@/components/combined/RankTable/TopPopulars'
import RankTable from '@/components/combined/RankTable'

function Explore() {
  return (
    <main className="mt-[60px]">
      <div className="pt-12 container">
        <h1 className="mb-10 text-[52px] leading-[80px] font-medium">Explore</h1>
        <section className="pb-6 flex gap-9">
          <div className="board w-[600px] h-[856px]">
            <h2>Trendy Influencers</h2>
            <Top1s />
          </div>
          <div className="board flex-1 h-[856px]">
            <h2>Most Popular</h2>
            <TopPopulars />
          </div>
        </section>
        <div className="board mt-[60px]">
          <h2>Top 100</h2>
          <RankTable></RankTable>
        </div>
      </div>
    </main>
  )
}

export default Explore
