import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const TestCompletePurchase = () => {
  const [purchaseId, setPurchaseId] = useState('');
  const { backendUrl, getToken, fetchEnrolledCourses } = useContext(AppContext);

  useEffect(() => {
    // Auto-fill from localStorage if available
    const lastPurchaseId = localStorage.getItem('lastPurchaseId');
    if (lastPurchaseId) {
      setPurchaseId(lastPurchaseId);
    }
  }, []);

  const completePurchase = async (e) => {
    e.preventDefault();
    
    if (!purchaseId.trim()) {
      toast.error('Please enter a purchase ID');
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/test-complete-purchase`,
        { purchaseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Purchase completed! Refreshing enrollments...');
        localStorage.removeItem('lastPurchaseId'); // Clear after successful completion
        setPurchaseId('');
        // Refresh enrolled courses
        setTimeout(async () => {
          await fetchEnrolledCourses();
          window.location.href = '/my-enrollments';
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Complete Purchase (Test)</h1>
        <p className="text-gray-600 mb-6 text-sm text-center">
          Use this page to manually complete a purchase and add it to your enrollments.
          This is a temporary workaround until webhooks are properly configured.
        </p>
        
        <form onSubmit={completePurchase} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Purchase ID</label>
            <input
              type="text"
              value={purchaseId}
              onChange={(e) => setPurchaseId(e.target.value)}
              placeholder="Enter your purchase ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Check your browser console after making a purchase to see the purchase ID
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Complete Purchase
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> In production, this would be handled automatically by Stripe webhooks.
            For local development, you need ngrok or Stripe CLI to receive webhooks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestCompletePurchase;
