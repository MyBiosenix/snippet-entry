import React, { useState } from "react";
import "../Styles/asa.css";
import { useNavigate, useLocation  } from "react-router-dom";
import axios from 'axios'
import { useEffect } from "react";



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
          const res = await axios.put(`http://localhost:5098/api/admin/${adminToEdit._id}/edit-admin`,{
            name, email, role, password
          });
          alert(res.data.message);
          navigate('/admin/manage-admin');
        }
        else{
          const res = await axios.post('http://localhost:5098/api/admin/create-admin',{
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
      <h3>{adminToEdit ? 'Edit Admin':'Add User'}</h3>
      <div className="inasacomp">
        <h4>Enter Basic Details</h4>
        <div className="form">
          <input type="text" placeholder="Enter Name*" value={name} required onChange={(e) => setName(e.target.value)}/>
          {nameError && <p className="error">{nameError}</p>}

          <input type="email" placeholder="Enter Email Id*" value={email} required onChange={(e) => setEmail(e.target.value)}/>
          {emailError && <p className="error">{emailError}</p>}

          <select value={role} onChange={handleChange} required>
            <option value="">Select Admin Type</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>

          <input type="text" placeholder="Enter Password*" value={password} required onChange={(e) => setPassword(e.target.value)}/>
          {passwordError && <p className="error">{passwordError}</p>}

          <input type="text" placeholder="Confirm Password" value={cnfpassword} required onChange={(e) => setcnfPassword(e.target.value)}/>
        </div>
        <div className="bttns">
          <button className="cancel" onClick={() => navigate('/admin/manage-admin')}>Cancel</button>
          <button className="submit" onClick={handlesubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default AsaComp;
