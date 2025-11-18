import React, { useEffect, useState } from 'react'
import '../Styles/dash.css'
import {FaUserShield, FaUsers, FaUserCheck, FaUserSlash} from 'react-icons/fa'
import axios from 'axios';

function Dashboard() {
    const [admins, setAdmins] = useState('');
    const [users, setUsers] = useState('');
    const [activeUsers, setActiveUsers] = useState('');
    const [inActiveUsers, setInactiveUsers] = useState('');

    const getStats = async() => {
        try{
            const res = await axios.get('https://api.freelancing-project.com/api/admin/dash-stats');
            setAdmins(res.data.totalAdmins);
            setUsers(res.data.totalUsers);
            setActiveUsers(res.data.activeUsers);
            setInactiveUsers(res.data.InactiveUsers);
        }
        catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                alert(err.response.data.message);
            } else {
                alert('Error Fetching User');
            }
        }
    }

    useEffect(() => {
        getStats()
    },[]);

  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
            <div className='box'>
                <FaUserShield className='icn'/>
                <div className='inbox'>
                    <h5>Total Admins</h5>
                    <h4>{admins}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUsers className='icn'/>
                <div className='inbox'>
                    <h5>Total Users</h5>
                    <h4>{users}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserCheck className='icn'/>
                <div className='inbox'>
                    <h5>Active Users</h5>
                    <h4>{activeUsers}</h4>
                </div>
            </div>

            <div className='box'>
                <FaUserSlash className='icn'/>
                <div className='inbox'>
                    <h5>Deactivated Users</h5>
                    <h4>{inActiveUsers}</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard