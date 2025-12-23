import React, { useState, useEffect } from 'react';
import '../Styles/login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo2 from '../../assets/logo2.png'

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) return;

      try {
        const res = await axios.get(`https://api.freelancing-project.com/api/auth/verify/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.valid) {
          navigate('/home');
        }
      } catch (err) {
        console.log('Token invalid or expired, clearing session');
        localStorage.clear();
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let valid = true;
    if (email === '') {
      alert('Email is Must');
      valid = false;
    }
    if (password === '') {
      alert('Password is Must');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid Email Format');
      valid = false;
    }
    if (password.length < 5) {
      setPasswordError('Password length should be at least 5');
      valid = false;
    }

    if (valid) {
      try {
        const res = await axios.post('http://localhost:5098/api/auth/login', {
          email,
          password,
          forceLogin: false,
        });

        alert('Login Successful');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userId', res.data.user.id);
        localStorage.setItem('isActive', res.data.user.isActive);
        navigate('/home');
      } catch (err) {
        if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.requiresForceLogin
        ) {
          const confirmForce = window.confirm(
            err.response.data.message + '\n\nDo you want to continue?'
          );
          if (confirmForce) {
            try {
              const res2 = await axios.post('https://api.freelancing-project.com/api/auth/login', {
                email,
                password,
                forceLogin: true,
              });
              alert('Logged in successfully on this device.');
              localStorage.setItem('token', res2.data.token);
              localStorage.setItem('user', JSON.stringify(res2.data.user));
              localStorage.setItem('userId', res2.data.user.id);
              localStorage.setItem('isActive', res2.data.user.isActive);
              navigate('/home');
            } catch (innerErr) {
              alert(innerErr.response?.data?.message || 'Login failed');
            }
          }
        } else if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert('Login Failed');
        }
      }
    }
  };

  return (
    <div className='mylogin'>
      <div className='login'>
        <img src={logo2} className='logo2' alt='Logo'/>
        <h2>User Login</h2>
        <div className='myinputs'>
          <div className='input'>
            <label>Email Id</label>
            <input
              type='text'
              placeholder='Enter Email Id'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <p className='error'>{emailError}</p>}
          </div>

          <div className='input password-field'>
            <label>Password</label>
            <div className='password-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className='toggle-password'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {passwordError && <p className='error'>{passwordError}</p>}
          </div>
        </div>

        <button className='logn' onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
