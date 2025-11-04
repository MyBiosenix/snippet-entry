import React from 'react'
import '../Styles/macomp.css'
import Header from '../Components/Header'
import ActiveComp from '../Components/ActiveComp'

function Active() {
  return (
    <div className='Macomp'>
        <Header/>
        <ActiveComp/>
    </div>
  )
}

export default Active