// src/components/receiptScanner/ReceiptList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ReceiptList = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const receiptsQuery = query(
          collection(db, 'receipts'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(receiptsQuery);
        const receiptList = [];
        
        querySnapshot.forEach((doc) => {
          receiptList.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setReceipts(receiptList);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [currentUser]);

  if (loading) {
    return <div className="text-center py-4">Loading receipts...</div>;
  }

  if (receipts.length === 0) {
    return (
      <div className="border border-gray-200 rounded-md py-6 px-4 text-center text-gray-500">
        No receipts yet. Upload your first receipt to get started.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <div 
                className="block hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/receipt/${receipt.id}`)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-indigo-600">
                      {receipt.merchantName || 'Unknown Merchant'}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      {receipt.status === 'processed' ? (
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Processed
                        </p>
                      ) : receipt.status === 'pending' ? (
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </p>
                      ) : (
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Error
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {receipt.date ? new Date(receipt.date).toLocaleDateString() : 
                          receipt.createdAt ? new Date(receipt.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {receipt.total ? `$${receipt.total}` : 'Amount not processed'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReceiptList;