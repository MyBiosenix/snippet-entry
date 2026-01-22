import React, { useState } from 'react'
import '../../Admin/Styles/login.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

function SLogin() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const navigate = useNavigate();

    const handlelogin = async() =>{
      setEmailError('');
      setPasswordError('');

      let valid = true;

      if((email === '')||(password === '')){
        alert('Please Fill both the fields');
        valid = false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailRegex.test(email)){
        setEmailError('Invalid Email Format');
        valid = false;
      }
      if(password.length<5){
        setPasswordError('Password length should atleast be of 5');
        valid = false;
      }

      if(valid){
        try{
          const res = await axios.post('http://localhost:5098/api/sub-admin/login',{
            email,password
          });
          alert('Login Succesful');
          localStorage.setItem('token',res.data.token);
          localStorage.setItem('subadmin', JSON.stringify(res.data.subadmin));
          localStorage.setItem('adminId', res.data.subadmin.id);
          navigate('/sub-admin/home')
        }
        catch(err){
          if(err.response && err.response.data && err.response.data.message){
            alert(err.response.data.message);
          }
          else{
            alert('Login Failed');
          }
        }
      }
    }


  return (
    <div className='mylogin1'>
      <div className='login1'>
        <h2>Sub-Admin Login</h2>
        <div className='myinputs1'>
            <div className='input1'>
                <label>Email Id</label>
                <input type='text' placeholder='Enter Email Id' value={email} onChange={(e) => setEmail(e.target.value)}/>
                {emailError && <p className='error'>{emailError}</p>}
            </div>
            <div className='input1'>
                <label>Password</label>
                <input type='text' placeholder='Enter Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                {passwordError && <p className='error'>{passwordError}</p>}
            </div>
        </div>

        <button onClick={handlelogin}>Login</button>
      </div>
    </div>
  )
}

export default SLogin