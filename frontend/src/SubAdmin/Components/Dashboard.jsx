import React, { useEffect, useState } from 'react'
import '../../Admin/Styles/dash.css'
import {FaUserShield, FaUsers, FaUserCheck, FaUserSlash, FaClock} from 'react-icons/fa'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {

    const [users,setUsers] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [inactiveUsers, setInactiveUsers] = useState(0);
    const [expiringsoonUsers, setExpiringSoonUsers] = useState(0);
    const [targetAchievedUsers, setTargetsAchievedUsers] = useState(0);

    const getStats = async() => {
        try{
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5098/api/sub-admin/stats',{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            });
            setUsers(res.data.totalUsers);
            setActiveUsers(res.data.activeUsers);
            setInactiveUsers(res.data.inactiveUsers);
            setExpiringSoonUsers(res.data.expiringSoonCount);
            setTargetsAchievedUsers(res.data.targetsAchievedCount);
        }
        catch(err){
            if (err.response && err.response.data && err.response.data.message) {
                alert(err.response.data.message);
            } else {
                alert('Error Fetching User');
            }
        }
    }

    useEffect(()=>{
        getStats();
    },[])

  return (
    <div className='mydassh'>
        <h3>Dashboard</h3>
        <div className='boxes'>
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
                    <h4>{inactiveUsers}</h4>
                </div>
            </div>

            <div className='box'>
                <FaClock className='icn'/>
                <div className='inbox'>
                    <h5>Expiring Soon</h5>
                    <h4>{expiringsoonUsers}</h4>
                </div>
            </div>

            <div className='box'>
                <FaClock className='icn'/>
                <div className='inbox'>
                    <h5>Targets Achieved</h5>
                    <h4>{targetAchievedUsers}</h4>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Dashboard