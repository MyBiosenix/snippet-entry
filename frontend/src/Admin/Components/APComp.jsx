import React, { useState, useEffect } from "react";
import "../Styles/asa.css";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";

function APComp() {
  const navigate = useNavigate();
  const location = useLocation();
  const packageToEdit = location.state?.packageToEdit || null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    if (packageToEdit) {
      setName(packageToEdit.name || '');
      setPrice(packageToEdit.price || '');
    }
  }, [packageToEdit]);

  const handlePackage = async () => {
    setNameError('');
    setPriceError('');

    let valid = true;
    if (!name) {
      setNameError('Package name is required');
      valid = false;
    }
    if (!price) {
      setPriceError('Price is required');
      valid = false;
    }

    if (!valid) return;

    try {
      if (packageToEdit) {
        const res = await axios.put(
          `http://localhost:5098/api/package/${packageToEdit._id}/edit-package`,
          { name, price }
        );
        alert(res.data.message || "Package updated successfully");
      } else {

        const res = await axios.post(
          'http://localhost:5098/api/package/create-package',
          { name, price }
        );
        alert(res.data.message || "Package added successfully");
      }
      navigate('/admin/manage-package');
    } catch (err) {
      alert(err.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="asacomp">
      <h3>{packageToEdit ? 'Edit Package' : 'Add Package'}</h3>
      <div className="inasacomp">
        <h4>Enter Basic Details</h4>
        <div className="form">
          <input
            type="text"
            value={name}
            placeholder="Enter Package Name*"
            onChange={(e) => setName(e.target.value)}
          />
          {nameError && <p className="error">{nameError}</p>}

          <input
            type="number"
            value={price}
            placeholder="Enter Price (Per Paragraph)*"
            onChange={(e) => setPrice(e.target.value)}
          />
          {priceError && <p className="error">{priceError}</p>}
        </div>

        <div className="bttns">
          <button className="cancel" onClick={() => navigate('/admin/manage-package')}>
            Cancel
          </button>
          <button className="submit" onClick={handlePackage}>
            {packageToEdit ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default APComp;