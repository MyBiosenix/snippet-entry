import React from 'react'
import '../Styles/macomp.css'
import Header from '../Components/Header'
import DraftComp from '../Components/DraftComp'

function Draft() {
  return (
    <div className='Macomp'>
        <Header/>
        <DraftComp/>
    </div>
  )
}

export default Draft