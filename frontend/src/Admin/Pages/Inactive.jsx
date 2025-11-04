import React from 'react'
import '../Styles/macomp.css'
import Header from '../Components/Header'
import InactiveComp from '../Components/InactiveComp'

function Inactive() {
  return (
    <div className='Macomp'>
        <Header/>
        <InactiveComp/>
    </div>
  )
}

export default Inactive