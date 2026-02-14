import React, { useState, useEffect, useMemo } from "react";
import "../Styles/asa.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function AUComp() {
  const location = useLocation();
  const navigate = useNavigate();

  const userToEdit = location.state?.userToEdit || null;

  const [adminList, setAdminList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");

  const [admin, setAdmin] = useState("");
  const [packages, setPackages] = useState("");
  const [paymentoptions, setPaymentOptions] = useState("");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");

  // ✅ expiry date + time inputs
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState("23:59"); // HH:mm

  const getAdminNames = async () => {
    try {
      const res = await axios.get("https://api.freelancing-project.com/api/admin/adminnames");
      setAdminList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching admins");
    }
  };

  const getPackageNames = async () => {
    try {
      // ✅ IMPORTANT: This API must return package price too
      // Example item: { _id, name, price } (or amount/cost)
      const res = await axios.get("https://api.freelancing-project.com/api/package/package-names");
      setPackagesList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching packages");
    }
  };

  useEffect(() => {
    getAdminNames();
    getPackageNames();
  }, []);

  // ✅ helper: combine date+time -> ISO string for backend
  const buildExpiryISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return "";
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const [hh, min] = timeStr.split(":").map(Number);

    const dt = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    return dt.toISOString();
  };

  // ✅ safest way to read price from your package object
  const getPackagePrice = (pkg) => {
    if (!pkg) return "";
    // support multiple possible keys (change based on your backend)
    const p =
      pkg.price ??
      pkg.amount ??
      pkg.cost ??
      pkg.packagePrice ??
      pkg.planPrice ??
      "";
    return p === "" || p === null || typeof p === "undefined" ? "" : String(p);
  };

  // ✅ fill form on edit
  useEffect(() => {
    if (!userToEdit) return;

    setName(userToEdit.name || "");
    setEmail(userToEdit.email || "");
    setMobile(userToEdit.mobile || "");
    setAdmin(userToEdit.admin?._id || "");
    setPackages(userToEdit.packages?._id || "");
    setPrice(userToEdit.price || "");
    setPaymentOptions(userToEdit.paymentoptions || "");

    if (userToEdit.date) {
      const d = new Date(userToEdit.date);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      setTime(`${hh}:${min}`);
    } else {
      setDate("");
      setTime("23:59");
    }
  }, [userToEdit]);

  // ✅ AUTO-FILL PRICE when package changes (works for Add + Edit)
  useEffect(() => {
    if (!packages) return;

    const selectedPkg = packagesList.find((p) => p._id === packages);
    const autoPrice = getPackagePrice(selectedPkg);

    // ✅ only auto-fill if:
    // - add mode OR
    // - price is empty OR
    // - current price equals old selected package price
    // (simple safe behavior: always overwrite on change)
    if (autoPrice !== "") {
      setPrice(autoPrice);
      setPriceError("");
    }
  }, [packages, packagesList]);

  // ✅ onChange handler (also supports auto-fill immediately)
  const handlePackageChange = (e) => {
    const pkgId = e.target.value;
    setPackages(pkgId);

    const selectedPkg = packagesList.find((p) => p._id === pkgId);
    const autoPrice = getPackagePrice(selectedPkg);

    if (autoPrice !== "") {
      setPrice(autoPrice);
      setPriceError("");
    } else {
      // if no price returned from API, keep price as-is
      // (or you can clear it: setPrice(""))
    }
  };

  const handleUser = async () => {
    setNameError("");
    setEmailError("");
    setMobileError("");
    setPriceError("");

    let valid = true;

    if (!name || !email || !admin || !packages || !price || !paymentoptions || !date || !time) {
      alert("Please fill all fields");
      valid = false;
    }

    if (name && name.length < 2) {
      setNameError("Name length cannot be less than 2 characters");
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError("Invalid email format");
      valid = false;
    }

    if (mobile && String(mobile).length < 10) {
      setMobileError("Mobile number cannot be less than 10 digits");
      valid = false;
    }

    const expiryISO = buildExpiryISO(date, time);
    if (!expiryISO) {
      alert("Please select expiry date and time");
      valid = false;
    }

    if (!valid) return;

    try {
      const payload = {
        name,
        email,
        mobile,
        admin,
        packages,
        price: Number(price),
        paymentoptions,
        date: expiryISO, // ✅ store expiry datetime in `date`
      };

      if (userToEdit) {
        const res = await axios.put(
          `https://api.freelancing-project.com/api/auth/${userToEdit._id}/edit-user`,
          payload
        );
        alert(res.data.message);
        navigate("/admin/manage-user");
      } else {
        const res = await axios.post("https://api.freelancing-project.com/api/auth/create-user", payload);
        alert(res.data.message);
        navigate("/admin/manage-user");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Server Error");
    }
  };

  return (
    <div className="asacomp">
      <h3>{userToEdit ? "Edit User" : "Add User"}</h3>

      <div className="inasacomp">
        <h4>Enter Basic Details</h4>

        <div className="form">
          <input
            type="text"
            value={name}
            placeholder="Enter Name*"
            onChange={(e) => setName(e.target.value)}
          />
          {nameError && <p className="error">{nameError}</p>}

          <input
            type="email"
            value={email}
            placeholder="Enter Email Id*"
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="error">{emailError}</p>}

          <input
            type="text"
            value={mobile}
            placeholder="Enter Mobile Number"
            onChange={(e) => setMobile(e.target.value)}
          />
          {mobileError && <p className="error">{mobileError}</p>}

          <select value={admin} onChange={(e) => setAdmin(e.target.value)}>
            <option value="">Select Admin</option>
            {adminList.map((adm) => (
              <option key={adm._id} value={adm._id}>
                {adm.name}
              </option>
            ))}
          </select>

          {/* ✅ Package select with auto price */}
          <select value={packages} onChange={handlePackageChange}>
            <option value="">Select Package</option>
            {packagesList.map((pkg) => (
              <option key={pkg._id} value={pkg._id}>
                {pkg.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={price}
            placeholder="Enter Package Price*"
            onChange={(e) => setPrice(e.target.value)}
          />
          {priceError && <p className="error">{priceError}</p>}

          <select value={paymentoptions} onChange={(e) => setPaymentOptions(e.target.value)}>
            <option value="">Select Payment Option</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
            <option value="gpay">GPAY</option>
            <option value="phonepe">PhonePe</option>
          </select>

          {/* ✅ Expiry Date + Time */}
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="bttns">
          <button className="cancel" onClick={() => navigate("/admin/manage-user")}>
            Cancel
          </button>
          <button className="submit" onClick={handleUser}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default AUComp;
