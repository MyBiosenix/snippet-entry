import React from 'react'
import '../Styles/macomp.css'

function UqComp() {
  return (
    <div className='comp'>
        <h3>User Queries</h3>
        <div className='incomp'>
            <div className='go'>
                <h4>All Query List</h4>
            </div>
            <div className='go'>
                <div className='mygo'>
                    <p>Excel</p>
                    <p>PDF</p>
                </div>
                <input type='text' placeholder='Search'/>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Sr.No.</th>
                        <th>Registration Id</th>
                        <th>User Name</th>
                        <th>Email Id</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>
                            No queries found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default UqComp
