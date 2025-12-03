import React from 'react'
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Login from './User/Pages/Login'
import Home from './User/Pages/Home'
import Typing from './User/Pages/Typing'
import CP from './User/Pages/CP'
import Profile from './User/Pages/Profile'
import Report from './User/Pages/Report'
import View from './User/Pages/View'


import AdminLogin from './Admin/Pages/AdminLogin'
import AdminHome from './Admin/Pages/AdminHome'
import MA from './Admin/Pages/MA'
import ASA from './Admin/Pages/ASA'
import MU from './Admin/Pages/MU'
import AU from './Admin/Pages/AU'
import MP from './Admin/Pages/MP'
import AP from './Admin/Pages/AP'
import UQ from './Admin/Pages/UQ'
import EU from './Admin/Pages/EU'
import Active from './Admin/Pages/Active'
import Inactive from './Admin/Pages/Inactive'
import ChangePassword from './Admin/Pages/ChangePassword'
import Result from './Admin/Pages/Result'

import ProtectedRoute from './User/utils/ProtectedRoute'
import TA from './Admin/Pages/TA'

function App() {
  return (
    <div>
      <Router>
        <Routes>

          {/* User Routes */}
          <Route 
            path='/home' 
            element={<Home/>}/>
          <Route path='/' element={<Login/>}/>
          <Route 
            path='/work' 
            element={
                      <ProtectedRoute>
                        <Typing/>
                      </ProtectedRoute>
                    }/>
          <Route 
            path="/work/:resultId" element={<Typing />} />
          <Route path='/change-password' element={<CP/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/report' element={<Report/>}/>
          <Route path='/view' element={<View/>}/>

          {/*Admin Routes */}
          <Route path='/admin/home' element={<AdminHome/>}/>
          <Route path='/admin/login' element={<AdminLogin/>}/>
          <Route path='/admin/change-password' element={<ChangePassword/>}/>
          
          <Route path='/admin/manage-admin' element={<MA/>}/>
          <Route path='/admin/manage-admin/add-admin' element={<ASA/>}/>
          <Route path='/admin/manage-user' element={<MU/>}/>
          <Route path='/admin/manage-user/add-user' element={<AU/>}/>
          <Route path='/admin/manage-user/result' element={<Result/>}/>
          <Route path='/admin/expiring-users' element={<EU/>}/>
          <Route path='/admin/targets-achieved' element={<TA/>}/>
          <Route path='/admin/manage-package' element={<MP/>}/>
          <Route path='/admin/manage-package/add-package' element={<AP/>}/>
          <Route path='/admin/user-queries' element={<UQ/>}/>
          <Route path='/admin/active-users' element={<Active/>}/>
          <Route path='/admin/inactive-users' element={<Inactive/>}/>
          
        </Routes>
      </Router>
    </div>
  )
}

export default App
