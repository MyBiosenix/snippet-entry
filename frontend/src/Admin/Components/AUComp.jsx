import React, { useState, useEffect } from "react";
import "../Styles/asa.css";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";

function AUComp() {
  const location = useLocation();
  const navigate = useNavigate();

  const userToEdit = location.state?.userToEdit || null;

  const [adminList, setAdminList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');

  const [admin, setAdmin] = useState('');
  const [packages, setPackages] = useState('');
  const [paymentoptions, setPaymentOptions] = useState('');
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [date, setDate] = useState('');

  const getAdminNames = async () => {
    try {
      const res = await axios.get('https://api.freelancing-project.com/api/admin/adminnames');
      setAdminList(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching admins");
    }
  }

  const getPackageNames = async () => {
    try {
      const res = await axios.get('https://api.freelancing-project.com/api/package/package-names');
      setPackagesList(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching packages");
    }
  }

  useEffect(() => {
    getAdminNames();
    getPackageNames();
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setMobile(userToEdit.mobile || '');
      setAdmin(userToEdit.admin?._id || '');
      setPackages(userToEdit.packages?._id || '');
      setPrice(userToEdit.price || '');
      setPaymentOptions(userToEdit.paymentoptions || '');
      setDate(userToEdit.date?.split("T")[0] || '');
    }
  }, [userToEdit]);

  const handleUser = async () => {
    setNameError('');
    setEmailError('');
    setMobileError('');
    setPriceError('');

    let valid = true;

    if (!name || !email || !admin || !packages || !price || !paymentoptions || !date) {
      alert('Please fill all fields');
      valid = false;
    }

    if (name.length < 2) {
      setNameError('Name length cannot be less than 2 characters');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }

    if (mobile.length < 10) {
      setMobileError('Mobile number cannot be less than 10 digits');
      valid = false;
    }

    if (valid) {
      try {
        if (userToEdit) {
          const res = await axios.put(`https://api.freelancing-project.com/api/auth/${userToEdit._id}/edit-user`, {
            name, email, mobile, admin, packages, price, paymentoptions, date
          });
          alert(res.data.message);
          navigate('/admin/manage-user');
        } else {
          const res = await axios.post('https://api.freelancing-project.com/api/auth/create-user', {
            name, email, mobile, admin, packages, price, paymentoptions, date
          });
          alert(res.data.message);
          navigate('/admin/manage-user');
        }
      } catch (err) {
        alert(err.response?.data?.message || "Server Error");
      }
    }
  }

  return (
    <div className="asacomp">
      <h3>{userToEdit ? 'Edit User' : 'Add User'}</h3>
      <div className="inasacomp">
        <h4>Enter Basic Details</h4>
        <div className="form">
          <input type="text" value={name} placeholder="Enter Name*" onChange={e => setName(e.target.value)} />
          {nameError && <p className="error">{nameError}</p>}

          <input type="email" value={email} placeholder="Enter Email Id*" onChange={e => setEmail(e.target.value)} />
          {emailError && <p className="error">{emailError}</p>}

          <input type="text" value={mobile} placeholder="Enter Mobile Number" onChange={e => setMobile(e.target.value)} />
          {mobileError && <p className="error">{mobileError}</p>}

          <select value={admin} onChange={e => setAdmin(e.target.value)}>
            <option value="">Select Admin</option>
            {adminList.map(adm => <option key={adm._id} value={adm._id}>{adm.name}</option>)}
          </select>

          <select value={packages} onChange={e => setPackages(e.target.value)}>
            <option value="">Select Package</option>
            {packagesList.map(pkg => <option key={pkg._id} value={pkg._id}>{pkg.name}</option>)}
          </select>

          <input type="number" value={price} placeholder="Enter Package Price*" onChange={e => setPrice(e.target.value)} />
          {priceError && <p className="error">{priceError}</p>}

          <select value={paymentoptions} onChange={e => setPaymentOptions(e.target.value)}>
            <option value="">Select Payment Option</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
            <option value="gpay">GPAY</option>
            <option value="phonepe">PhonePe</option>
          </select>

          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="bttns">
          <button className="cancel" onClick={() => navigate('/admin/manage-user')}>Cancel</button>
          <button className="submit" onClick={handleUser}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default AUComp;
