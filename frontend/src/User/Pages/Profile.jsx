import React from 'react'
import Header from '../Components/Header';
import ProfileComp from '../Components/ProfileComp';
import '../Styles/profile.css' 

function Profile() {
  return (
    <div className='profile'>
        <Header/>
        <ProfileComp/>
    </div>
  )
}

export default Profile
