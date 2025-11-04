import React, { useEffect, useState } from 'react'
import '../Styles/profile.css'
import axios from 'axios';

function ProfileComp() {
  const id = localStorage.getItem('userId');
  const [user, setUser] = useState({});

  const getUser = async () => {
    try {
      const res = await axios.get(`http://localhost:5098/api/auth/${id}/user`);
      setUser(res.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert('Error Fetching User');
      }
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-details">
        <p><strong>Name:</strong> <span>{user.name}</span></p>
        <p><strong>Email:</strong> <span>{user.email}</span></p>
        <p><strong>Password:</strong> <span>{user.password}</span></p>
        <p><strong>Mobile No.:</strong> <span>{user.mobile}</span></p>
        <p><strong>Admin:</strong> <span>{user.admin?.name}</span></p>
        <p><strong>Package:</strong> <span>{user.packages?.name}</span></p>
        <p><strong>Price:</strong> <span>{user.price}</span></p>
        <p><strong>Subscription Validity:</strong> 
          <span>{user.date ? new Date(user.date).toLocaleDateString() : '—'}</span>
        </p>

      </div>
    </div>
  )
}

export default ProfileComp;
