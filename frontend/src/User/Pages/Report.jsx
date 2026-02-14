import React from 'react'
import ReportComp from '../Components/ReportComp';
import Header from '../Components/Header'
import '../Styles/reports.css'

function Report() {
  return (
    <div className='report-page'>
      <Header/>
      <div className='imim'>
        <ReportComp/>
      </div>
    </div>
  )
}

export default Report
