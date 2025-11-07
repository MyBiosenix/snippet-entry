import React, { useState } from "react";
import "../../Admin/Styles/asa.css";
import { useNavigate, useLocation  } from "react-router-dom";
import axios from 'axios'
import { useEffect } from "react";



function CPComp() {

  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newpassError, setNewPassError] = useState("");

  const id = localStorage.getItem("userId");

  const handlesubmit = async() => {
    setNewPassError('');

    let valid = true;

    if(newPass.length<5){
      setNewPassError('Password Length should not be less than 5');
      valid = false;
    }

    if(valid){
      try{
        const res = await axios.put(`https://dms-2g0q.onrender.com/api/auth/${id}/change-password`,{
            password, newPassword:newPass
        });
        alert(res.data.message);
        navigate('/home')
      }
      catch(err){
        if(err.response && err.response.data && err.response.data.message){
          alert(err.response.data.message);
        }
        else{
          alert('Server Error');
        }
      }
    }
  }



  return (
    <div className="asacomp">
      <h3>Change Password</h3>
      <div className="inasacomp">
        <h4>Enter Basic Details</h4>
        <div className="form">

          <input type="text" placeholder="Enter Password*" value={password} required onChange={(e) => setPassword(e.target.value)}/>

          <input type="text" placeholder="Confirm Password" value={newPass} required onChange={(e) => setNewPass(e.target.value)}/>
             {newpassError && <p className="error">{newpassError}</p>}
        </div>
        <div className="bttns">
          <button className="cancel" onClick={() => navigate('/home')}>Cancel</button>
          <button className="submit" onClick={handlesubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default CPComp;
