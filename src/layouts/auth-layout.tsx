import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { Icon } from "@iconify/react";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary-600 flex-col justify-center items-center p-8 text-white">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <Icon icon="lucide:search" className="text-4xl mr-2" />
            <h1 className="text-3xl font-bold">DecisionFindr</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4">AI-Powered LinkedIn Prospecting</h2>
          <p className="text-lg mb-8 text-primary-100">
            Find the right decision-makers at your target companies with precision and ease.
            Save time and connect with the people who matter most to your business.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Smart Targeting</h3>
              <p className="text-sm text-primary-100">Identify key decision-makers based on job titles and company data</p>
            </div>
            <div className="bg-primary-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">CRM Integration</h3>
              <p className="text-sm text-primary-100">Seamlessly export to HubSpot, Salesforce, and more</p>
            </div>
            <div className="bg-primary-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Advanced Filters</h3>
              <p className="text-sm text-primary-100">Filter by industry, location, company size, and more</p>
            </div>
            <div className="bg-primary-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Time Saving</h3>
              <p className="text-sm text-primary-100">Reduce prospecting time by up to 80% with AI assistance</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center justify-center mb-8">
            <Icon icon="lucide:search" className="text-3xl mr-2 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">DecisionFindr</h1>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}