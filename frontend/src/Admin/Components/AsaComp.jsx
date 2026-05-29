import React, { useState } from "react";
import "../Styles/asa.css";
import { useNavigate, useLocation  } from "react-router-dom";
import axios from 'axios'
import { useEffect } from "react";
import { API_BASE } from "../../utils/api";



function AsaComp() {

  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [cnfpassword, setcnfPassword] = useState("");

  const adminToEdit = location.state?.adminToEdit || null;

  const handlesubmit = async() => {
    setNameError('');
    setEmailError('');
    setPasswordError('');

    let valid = true;
    if(!name || !email || !password || !role || !cnfpassword){
      alert('Please Fill all the Fields');
      valid = false;
    }

    if(name.length<2){
      setNameError('Name Length Cannot be less than 2 characters');
      valid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      setEmailError("Invalid Email Format");
      valid = false;
    }

    if(password.length<5){
      setPasswordError('Password Length should not be less than 5');
      valid = false;
    }

    if(password !== cnfpassword){
      alert("Passwords Not Matching");
      valid = false;
    }

    if(valid){
      try{
        if(adminToEdit){
          const res = await axios.put(`${API_BASE}/admin/${adminToEdit._id}/edit-admin`,{
            name, email, role, password
          });
          alert(res.data.message);
          navigate('/admin/manage-admin');
        }
        else{
          const res = await axios.post(`${API_BASE}/admin/create-admin`,{
          name, email, role,password
          });
          alert(res.data.message);
          navigate('/admin/manage-admin');
        }
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

  useEffect(() => {
    if(adminToEdit){
      setName(adminToEdit.name || '');
      setEmail(adminToEdit.email || '');
      setRole(adminToEdit.role);
      setPassword(adminToEdit.password);
    }
  },[adminToEdit]);

  const handleChange = (event) => {
    setRole(event.target.value);
  };

  return (
   <div className="asacomp">
  <h3>{adminToEdit ? 'Edit admin' : 'Add admin'}</h3>
  <div className="inasacomp">
    <h4>Enter basic details</h4>
    <div className="form">

      <div className="field">
        <label>Full name <span style={{color:'#dc2626'}}>*</span></label>
        <input type="text" placeholder="e.g. Rohit Sharma"
          className={nameError ? 'has-err' : ''}
          value={name} onChange={(e) => setName(e.target.value)} />
        {nameError && <p className="error">{nameError}</p>}
      </div>

      <div className="field">
        <label>Email address <span style={{color:'#dc2626'}}>*</span></label>
        <input type="email" placeholder="e.g. rohit@example.com"
          className={emailError ? 'has-err' : ''}
          value={email} onChange={(e) => setEmail(e.target.value)} />
        {emailError && <p className="error">{emailError}</p>}
      </div>

      <div className="field">
        <label>Admin type <span style={{color:'#dc2626'}}>*</span></label>
        <select value={role} onChange={handleChange}>
          <option value="">Select admin type</option>
          <option value="superadmin">Super admin</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="field">
        <label>Password <span style={{color:'#dc2626'}}>*</span></label>
        <input type="password" placeholder="Min. 8 characters"
          className={passwordError ? 'has-err' : ''}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {passwordError && <p className="error">{passwordError}</p>}
      </div>

      <div className="field">
        <label>Confirm password <span style={{color:'#dc2626'}}>*</span></label>
        <input type="password" placeholder="Re-enter password"
          value={cnfpassword} onChange={(e) => setcnfPassword(e.target.value)} />
      </div>

    </div>
    <div className="bttns">
      <button className="cancel" onClick={() => navigate('/admin/manage-admin')}>Cancel</button>
      <button className="submit" onClick={handlesubmit}>Save admin</button>
    </div>
  </div>
</div>
  );
}

export default AsaComp;
