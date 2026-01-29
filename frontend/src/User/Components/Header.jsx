import React, { useEffect, useState } from 'react'
import '../Styles/header.css'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaTachometerAlt, FaKeyboard, FaRegQuestionCircle, FaSignOutAlt} from 'react-icons/fa'
import { FiMenu } from 'react-icons/fi'
import { FaUserCircle, FaKey} from 'react-icons/fa'

function Header() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [username, setUserName] = useState('');

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log(userData.name);
        if(userData && userData.name){
            setUserName(userData.name);
        }
    })

    const handleLogout = async () => {
  const confirmLogout = window.confirm("Do you really want to Logout?");
  if (!confirmLogout) return;

  try {
    const token = localStorage.getItem('token');
    await fetch("https://api.freelancing-project.com/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isActive');

    navigate('/');
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Error logging out. Please try again.");
  }
};

  return (
    <div>
        <div className='myheader'>
            <div className='in1'>
                <FiMenu className='menu' onClick={() => setOpen(!open)}/>
                <h3>DATA MANAGEMENT SOFTWARE</h3>
            </div>
            <div className='in-header' onClick={() => setShowDropdown(!showDropdown)}>
                <FaUser className='usericon'/>
                <div className='udet'>
                    <p>{username}</p>
                    <p style={{ color:'gray'}}>User</p>
                </div>
            </div>
        </div>

        <div className={`sidebar ${open ? 'open':''}`}>
            <p className='myp' onClick={() => navigate('/home')}><FaTachometerAlt/>Dashboard</p>
            <p className='myp' onClick={() => navigate('/work')}><FaKeyboard/>Typing Work</p>


            <h5 className='lop' onClick={handleLogout}><FaSignOutAlt/>Logout</h5>
        </div>
        {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

        <div className={`dropdown ${showDropdown ? 'showDropdown':''}`}>
            <p className='dop' onClick={() => navigate('/profile')}><FaUserCircle/>Profile</p>
            <p className='dop' onClick={() => navigate('/change-password')}><FaKey/>Change Password</p>
        </div>
    </div>
  )
}

export default Header
