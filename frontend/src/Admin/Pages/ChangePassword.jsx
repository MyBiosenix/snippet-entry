import React from 'react'
import ChangePassComp from '../Components/ChangePassComp'
import Header from '../Components/Header'
import '../../User/Styles/CP.css'

function ChangePassword() {
  return (
    <div className='cp'>
        <Header/>
        <ChangePassComp/>
    </div>
  )
}

export default ChangePassword
