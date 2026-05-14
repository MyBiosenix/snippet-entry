import React, { useState, useEffect } from 'react';
import '../Styles/login.css';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import logo2 from '../../assets/logo2.png'
import http from '../../utils/http';
import { getStoredUserId, getUserToken } from '../../utils/auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const storeUserSession = (payload) => {
    const user = payload?.user || payload?.data || payload?.userData || payload;
    const token = payload?.token;

    if (token) {
      localStorage.setItem('userToken', token);
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      const storedUserId = user._id || user.id;
      if (storedUserId) {
        localStorage.setItem('userId', storedUserId);
      }
      if (typeof user.isActive !== 'undefined') {
        localStorage.setItem('isActive', String(user.isActive));
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        getUserToken();
      const userId = getStoredUserId();

      if (!token || !userId) return;

      try {
        const res = await http.get(`/auth/verify/${userId}`);

        if (res.data.valid) {
          navigate('/home');
        }
      } catch {
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
        const res = await http.post('/auth/login', {
          email,
          password,
          forceLogin: false,
        });

        alert('Login Successful');
        storeUserSession(res.data);
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
              const res2 = await http.post('/auth/login', {
                email,
                password,
                forceLogin: true,
              });
              alert('Logged in successfully on this device.');
              storeUserSession(res2.data);
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
