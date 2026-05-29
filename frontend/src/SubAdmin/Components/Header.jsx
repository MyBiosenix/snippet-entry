import React, { useEffect, useState } from 'react'
import { FaUsers, FaBoxOpen, FaUserCheck, FaUserTimes, FaTachometerAlt, FaSignOutAlt, FaKey, FaUserCircle, FaUser } from 'react-icons/fa'
import { FiMenu } from 'react-icons/fi'
import '../../User/Styles/header.css'
import { useNavigate, useLocation } from 'react-router-dom'
import { clearSubAdminSession } from '../../utils/auth'

function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const [open, setOpen] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [subadminName, setSubAdminName] = useState('')
    const [subadminRole, setSubAdminRole] = useState('')

    useEffect(() => {
        const subAdminData = JSON.parse(localStorage.getItem('subadmin'))
        if (subAdminData) {
            setSubAdminName(subAdminData.name)
            setSubAdminRole(subAdminData.role)
        }
    }, [])

    useEffect(() => {
        const handleClick = () => setShowDropdown(false)
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Do you really want to logout?')
        if (confirmLogout) {
            clearSubAdminSession()
            navigate('/sub-admin/login')
        }
    }

    const isActive = (path) => location.pathname === path

    return (
        <div>
            {/* ── Header ── */}
            <div className='myheader'>
                <div className='in1'>
                    <FiMenu className='menu' onClick={() => setOpen(!open)} />
                    <h3>KeyTrack</h3>
                </div>
                <div
                    className='in-header'
                    onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown) }}
                >
                    <div className='adicon'>
                        <FaUser />
                    </div>
                    <div className='udet'>
                        <p>{subadminName}</p>
                        <span className='role'>{subadminRole}</span>
                    </div>

                    {/* Dropdown — inside in-header so it positions correctly */}
                    <div className={`dropdown ${showDropdown ? 'showDropdown' : ''}`}>
                        <div className='dop'>
                            <FaUserCircle /> Profile
                        </div>
                        <div className='dop' onClick={() => navigate('/sub-admin/change-password')}>
                            <FaKey /> Change password
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sidebar ── */}
            <div className={`sidebar ${open ? 'open' : ''}`}>

                <div className='sb-section-label'>Main</div>

                <div
                    className={`myp ${isActive('/sub-admin/home') ? 'active' : ''}`}
                    onClick={() => { navigate('/sub-admin/home'); setOpen(false) }}
                >
                    <FaTachometerAlt /> Dashboard
                </div>

                <div
                    className={`myp ${isActive('/sub-admin/manage-user') ? 'active' : ''}`}
                    onClick={() => { navigate('/sub-admin/manage-user'); setOpen(false) }}
                >
                    <FaUsers /> Manage users
                </div>

                <div
                    className={`myp ${isActive('/sub-admin/manage-packages') ? 'active' : ''}`}
                    onClick={() => { navigate('/sub-admin/manage-packages'); setOpen(false) }}
                >
                    <FaBoxOpen /> Manage packages
                </div>

                <div className='sb-section-label' style={{ marginTop: '0.5rem' }}>Users</div>

                <div
                    className={`myp ${isActive('/sub-admin/active-users') ? 'active' : ''}`}
                    onClick={() => { navigate('/sub-admin/active-users'); setOpen(false) }}
                >
                    <FaUserCheck /> Active users
                </div>

                <div
                    className={`myp ${isActive('/sub-admin/inactive-users') ? 'active' : ''}`}
                    onClick={() => { navigate('/sub-admin/inactive-users'); setOpen(false) }}
                >
                    <FaUserTimes /> Deactivated users
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div className='lop' onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                    </div>
                </div>
            </div>

            {/* ── Overlay ── */}
            {open && <div className='overlay' onClick={() => setOpen(false)} />}
        </div>
    )
}

export default Header