// src/components/receiptScanner/ReceiptScanner.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage, db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import ReceiptList from './ReceiptList';

const ReceiptScanner = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle');

  // Initialize Firebase Functions
  const functions = getFunctions();
  const processReceipt = httpsCallable(functions, 'processReceipt');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedImage);
      setPreview(previewUrl);
      
      // Reset states
      setError('');
      setSuccess(false);
      setProcessingStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProcessingStatus('uploading');
      
      // Create a reference to upload the image
      const storageRef = ref(storage, `receipts/${currentUser.uid}/${Date.now()}-${image.name}`);
      
      // Upload the image
      const snapshot = await uploadBytes(storageRef, image);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save receipt data to Firestore
      const docRef = await addDoc(collection(db, 'receipts'), {
        userId: currentUser.uid,
        imageUrl: downloadURL,
        status: 'pending', // pending, processed, error
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        merchantName: '',
        date: '',
        total: '',
        items: []
      });
      
      setSuccess(true);
      
      // Process the receipt with OCR
      try {
        setProcessingStatus('processing');
        const result = await processReceipt({ 
          imageUrl: downloadURL,
          receiptId: docRef.id
        });
        
        setProcessingStatus('complete');
        console.log('OCR Results:', result.data);
        
      } catch (ocrError) {
        console.error('Error processing receipt:', ocrError);
        setProcessingStatus('error');
        // The receipt is still uploaded, just not processed
      }
      
      // Clear the image after upload
      setImage(null);
      setPreview(null);
      
    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError('Failed to upload receipt. Please try again.');
      setProcessingStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Receipt Scanner
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload a Receipt</h2>
                <p className="text-gray-600">Take a photo or upload an image of your receipt</p>
              </div>
              
              {error && (
                <div className="mb-4 w-full max-w-md rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {success && (
                <div className="mb-4 w-full max-w-md rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">Receipt uploaded successfully!</div>
                </div>
              )}

              {processingStatus !== 'idle' && processingStatus !== 'error' && (
                <div className="mb-4 w-full max-w-md rounded-md bg-blue-50 p-4">
                  <div className="text-sm text-blue-700">
                    {processingStatus === 'uploading' && 'Uploading image...'}
                    {processingStatus === 'processing' && 'Processing with OCR...'}
                    {processingStatus === 'complete' && 'Receipt processed successfully!'}
                  </div>
                </div>
              )}
              
              <div className="w-full max-w-md">
                {preview ? (
                  <div className="mb-6">
                    <img 
                      src={preview} 
                      alt="Receipt preview" 
                      className="w-full h-auto rounded-md shadow-md max-h-96 object-contain"
                    />
                    <div className="mt-4 flex justify-between">
                      <button 
                        onClick={() => {
                          setImage(null);
                          setPreview(null);
                        }}
                        className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpload}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? 'Uploading...' : 'Upload Receipt'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">or</span>
                </div>
                
                <button 
                  className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    // Here we would normally activate the camera
                    alert('Camera functionality would be implemented here in a full app');
                  }}
                >
                  Take a Photo
                </button>
              </div>
              
              <div className="mt-12 w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Receipts</h3>
                <ReceiptList />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceiptScanner;