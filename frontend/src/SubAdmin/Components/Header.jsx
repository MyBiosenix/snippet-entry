import React, { useEffect, useState } from 'react'
import { FaUser, FaUserShield, FaUsers, FaBoxOpen, FaQuestionCircle, FaUserCheck, FaUserTimes,FaTachometerAlt, FaSignOutAlt, FaKey, FaUserCircle } from 'react-icons/fa'
import { FiMenu } from 'react-icons/fi'
import '../../User/Styles/header.css'
import { useNavigate } from 'react-router-dom'

function Header() {
    const navigate = useNavigate();
    const [ open, setOpen ] = useState(false);
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ subadminName, setSubAdminName ] = useState('');
    const [ subadminRole, setSubAdminRole ] = useState('');

    useEffect(()=>{
        const subAdminData = JSON.parse(localStorage.getItem('subadmin'));
        if(subAdminData){
            setSubAdminName(subAdminData.name);
            setSubAdminRole(subAdminData.role);
        } 
    })

    const handleLogout = async() => {
        const confirmLogout = window.confirm('Do You Really want to Logout?');

        if(confirmLogout){
            localStorage.removeItem('subadmin');
            localStorage.removeItem('token');
            localStorage.removeItem('subadminId');

            navigate('/sub-admin/login');
        }
    }
  return (
    <div>
        <div className='myheader'>
            <div className='in1'>
                <FiMenu className='menu' onClick={() => setOpen(!open)}/>
                <h3>KeyTrack</h3>
            </div>
            <div className='in-header' onClick={() => setShowDropdown(!showDropdown)}>
                <FaUser className='adicon' />
                <div className='udet'>
                    <p>{subadminName}</p>
                    <p style={{ color:'gray' }}>{subadminRole}</p>
                </div>
            </div>
        </div>

        <div className={`sidebar ${open ? 'open':''}`}>
            <p className='myp' onClick={()=>navigate('/sub-admin/home')}><FaTachometerAlt/>Dashboard</p>  
            <p className='myp' onClick={()=>navigate('/sub-admin/manage-user')}><FaUsers className='sidebar-icon'/>Manage User</p>
            <p className='myp' onClick={()=>navigate('/sub-admin/manage-packages')}><FaBoxOpen className='sidebar-icon'/>Manage Packages</p>
            <p className='myp' onClick={()=>navigate('/sub-admin/active-users')}><FaUserCheck className='sidebar-icon'/>Active Users</p>
            <p className='myp' onClick={()=>navigate('/sub-admin/inactive-users')}><FaUserTimes className='sidebar-icon'/>Deactivated Users</p>

            <h5 className='lop' onClick={handleLogout}><FaSignOutAlt className='signout-icon'/>Logout</h5>
        </div>

        {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

        <div className={`dropdown ${showDropdown ? 'showDropdown':''}`}>
            <p className='dop'><FaUserCircle/>Profile</p>
            <p className='dop' onClick={()=>navigate('/admin/change-password')}><FaKey/>Change Password</p>
        </div>
    </div>
  )
}

export default Header
