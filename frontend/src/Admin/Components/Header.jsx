import React, { useEffect, useState } from 'react'
import { FaUser, FaUserShield, FaUsers, FaBoxOpen, FaQuestionCircle, FaUserCheck, FaUserTimes,FaTachometerAlt, FaSignOutAlt, FaKey, FaUserCircle } from 'react-icons/fa'
import { FiMenu } from 'react-icons/fi'
import '../../User/Styles/header.css'
import { useNavigate } from 'react-router-dom'

function Header() {
    const navigate = useNavigate();
    const [ open, setOpen ] = useState(false);
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ adminName, setAdminName ] = useState('');
    const [ adminRole, setAdminRole ] = useState('');

    useEffect(() => {
        const adminData = JSON.parse(localStorage.getItem('admin'));
        console.log(adminData.name);
        if(adminData && adminData.name){
            setAdminName(adminData.name);
        }
        if(adminData && adminData.role){
            setAdminRole(adminData.role);
        }
    })

    const handleLogout = async() => {

        const confirmLogout = window.confirm("Do you really want to log out?");

        if(confirmLogout){
            localStorage.removeItem('admin');
            localStorage.removeItem('token');
            localStorage.removeItem('adminId');

            navigate('/admin/login')
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
                    <p>{adminName}</p>
                    <p style={{ color:'gray' }}>{adminRole}</p>
                </div>
            </div>
        </div>

        <div className={`sidebar ${open ? 'open':''}`}>
            <p className='myp' onClick={() => navigate('/admin/home')}><FaTachometerAlt/>Dashboard</p>
            {adminRole === "superadmin" && (
                <>
                    <p className='myp' onClick={() => navigate('/admin/manage-admin')}><FaUserShield className='sidebar-icon'/>Manage Admin</p>  
                </>
            )}
            <p className='myp' onClick={() => navigate('/admin/manage-user')}><FaUsers className='sidebar-icon'/>Manage User</p>
            <p className='myp' onClick={() => navigate('/admin/manage-package')}><FaBoxOpen className='sidebar-icon'/>Manage Packages</p>
            <p className='myp' onClick={() => navigate('/admin/user-queries')}><FaQuestionCircle className='sidebar-icon'/>User Queries</p>
            <p className='myp' onClick={() => navigate('/admin/active-users')}><FaUserCheck className='sidebar-icon'/>Active Users</p>
            <p className='myp' onClick={() => navigate('/admin/inactive-users')}><FaUserTimes className='sidebar-icon'/>Deactivated Users</p>

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
