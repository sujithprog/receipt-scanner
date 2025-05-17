// src/components/receiptScanner/ReceiptDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ReceiptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const receiptDoc = await getDoc(doc(db, 'receipts', id));
        if (receiptDoc.exists()) {
          setReceipt({ id: receiptDoc.id, ...receiptDoc.data() });
        } else {
          setError('Receipt not found');
        }
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Failed to load receipt details');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading receipt details...</div>;
  if (error) return <div className="text-red-600 text-center py-12">{error}</div>;
  if (!receipt) return <div className="text-center py-12">No receipt found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Receipt Details
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {receipt.merchantName || 'Unknown Merchant'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {receipt.date ? new Date(receipt.date).toLocaleDateString() : 
                  receipt.createdAt && receipt.createdAt.toDate ? new Date(receipt.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${receipt.total || '0.00'}
            </div>
          </div>

          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {receipt.status === 'processed' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Processed
                    </span>
                  ) : receipt.status === 'pending' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Error
                    </span>
                  )}
                </dd>
              </div>

              {receipt.subtotal && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Subtotal
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${receipt.subtotal}
                  </dd>
                </div>
              )}

              {receipt.tax && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Tax
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${receipt.tax}
                  </dd>
                </div>
              )}

              {receipt.items && receipt.items.length > 0 && (
                <div className="bg-white px-4 py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 mb-4">
                    Items
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {receipt.items.map((item, index) => (
                        <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              {item.name || item.description || `Item ${index + 1}`}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            ${item.price || '0.00'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}

              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Receipt Image
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <img 
                    src={receipt.imageUrl} 
                    alt="Receipt" 
                    className="max-w-full h-auto rounded shadow-md"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceiptDetail;