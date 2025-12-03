import React, { useEffect, useState } from 'react'
import '../Styles/dash.css'
import {FaUserShield, FaUsers, FaUserCheck, FaUserSlash, FaClock} from 'react-icons/fa'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [admins, setAdmins] = useState(0);
    const [users, setUsers] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [inActiveUsers, setInactiveUsers] = useState(0);
    const [expiringSoon, setExpiringSoon] = useState(0);
    const [targetsachieved, setTargetsAchieved] = useState(0);

    const navigate = useNavigate();

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

    const getexpiringSoon = async() => {
        try{
            const res = await axios.get("https://api.freelancing-project.com/api/auth/expiring-soon")
            setExpiringSoon(res.data.totalExpiringSoon);
        }
        catch(err){
            console.error(err);
            setExpiringSoon(0);
        }
    }

    const getTargetsAchieved = async() => {
        try{
            const res = await axios.get("https://api.freelancing-project.com/api/auth/targets-achieved")
            setTargetsAchieved(res.data.count);
        }
        catch(err){
            console.error(err);
            setTargetsAchieved(0);
        }
    }

    useEffect(() => {
        getStats();
        getexpiringSoon();
        getTargetsAchieved();
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

            <div className='box' onClick={()=>navigate('/admin/expiring-users')}>
                <FaClock className='icn'/>
                <div className='inbox'>
                    <h5>Expiring Soon</h5>
                    <h4>{expiringSoon}</h4>
                </div>
            </div>

            <div className='box' onClick={()=>navigate('/admin/targets-achieved')}>
                <FaClock className='icn'/>
                <div className='inbox'>
                    <h5>Targets Achieved</h5>
                    <h4>{targetsachieved}</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard