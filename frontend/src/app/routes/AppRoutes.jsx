import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "../../User/Pages/Login";
import Home from "../../User/Pages/Home";
import Typing from "../../User/Pages/Typing";
import CP from "../../User/Pages/CP";
import Profile from "../../User/Pages/Profile";
import Report from "../../User/Pages/Report";
import View from "../../User/Pages/View";

import AdminLogin from "../../Admin/Pages/AdminLogin";
import AdminHome from "../../Admin/Pages/AdminHome";
import MA from "../../Admin/Pages/MA";
import ASA from "../../Admin/Pages/ASA";
import MU from "../../Admin/Pages/MU";
import AU from "../../Admin/Pages/AU";
import MP from "../../Admin/Pages/MP";
import AP from "../../Admin/Pages/AP";
import UQ from "../../Admin/Pages/UQ";
import EU from "../../Admin/Pages/EU";
import Active from "../../Admin/Pages/Active";
import Inactive from "../../Admin/Pages/Inactive";
import ChangePassword from "../../Admin/Pages/ChangePassword";
import Result from "../../Admin/Pages/Result";
import Drafts from "../../Admin/Pages/Drafts";
import TA from "../../Admin/Pages/TA";

import SHome from "../../SubAdmin/Pages/SHome";
import SLogin from "../../SubAdmin/Pages/SLogin";
import SMU from "../../SubAdmin/Pages/SMU";
import SMP from "../../SubAdmin/Pages/SMP";
import SAU from "../../SubAdmin/Pages/SAU";
import SIAU from "../../SubAdmin/Pages/SIAU";

import ProtectedRoute from "../../User/utils/ProtectedRoute";
import AdminProtectedRoute from "../../Admin/utils/AdminProtectedRoute";
import SubAdminProtectedRoute from "../../SubAdmin/utils/SubAdminProtectedRoute";
import TrashUsers from "../../Admin/Pages/TrashUsers";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<Login />} />
      <Route
        path="/work"
        element={
          <ProtectedRoute>
            <Typing />
          </ProtectedRoute>
        }
      />
      <Route path="/work/:resultId" element={<Typing />} />
      <Route path="/change-password" element={<CP />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/report" element={<Report />} />
      <Route path="/view" element={<View />} />
      

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/home"
        element={
          <AdminProtectedRoute>
            <AdminHome />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/change-password"
        element={
          <AdminProtectedRoute>
            <ChangePassword />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-admin"
        element={
          <AdminProtectedRoute>
            <MA />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-admin/add-admin"
        element={
          <AdminProtectedRoute>
            <ASA />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-user"
        element={
          <AdminProtectedRoute>
            <MU />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-user/add-user"
        element={
          <AdminProtectedRoute>
            <AU />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-user/result"
        element={
          <AdminProtectedRoute>
            <Result />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/expiring-users"
        element={
          <AdminProtectedRoute>
            <EU />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/targets-achieved"
        element={
          <AdminProtectedRoute>
            <TA />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-package"
        element={
          <AdminProtectedRoute>
            <MP />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-package/add-package"
        element={
          <AdminProtectedRoute>
            <AP />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/user-queries"
        element={
          <AdminProtectedRoute>
            <UQ />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/active-users"
        element={
          <AdminProtectedRoute>
            <Active />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/inactive-users"
        element={
          <AdminProtectedRoute>
            <Inactive />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/drafts"
        element={
          <AdminProtectedRoute>
            <Drafts />
          </AdminProtectedRoute>
        }
      />

        <Route
    path="/admin/trash-users"
    element={
      <AdminProtectedRoute>
        <TrashUsers />
      </AdminProtectedRoute>
    }
  />

  <Route path="/sub-admin/login" element={<SLogin />} />
      <Route
        path="/sub-admin/home"
        element={
          <SubAdminProtectedRoute>
            <SHome />
          </SubAdminProtectedRoute>
        }
      />
      <Route
        path="/sub-admin/manage-user"
        element={
          <SubAdminProtectedRoute>
            <SMU />
          </SubAdminProtectedRoute>
        }
      />
      <Route
        path="/sub-admin/manage-user/result"
        element={
          <SubAdminProtectedRoute>
            <Result />
          </SubAdminProtectedRoute>
        }
      />
      <Route
        path="/sub-admin/manage-packages"
        element={
          <SubAdminProtectedRoute>
            <SMP />
          </SubAdminProtectedRoute>
        }
      />
      <Route
        path="/sub-admin/active-users"
        element={
          <SubAdminProtectedRoute>
            <SAU />
          </SubAdminProtectedRoute>
        }
      />
      <Route
        path="/sub-admin/inactive-users"
        element={
          <SubAdminProtectedRoute>
            <SIAU />
          </SubAdminProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
