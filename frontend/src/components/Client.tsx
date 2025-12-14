import { useState, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface ClientInfo {
  name: string;
  email: string;
  birthDate: string;
}

const Client = () => {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const [clientId, setClientId] = useState<string>('1');

  useEffect(() => {
    fetch(`http://localhost:8080/api/client/${clientId}`)
      .then(res => res.json())
      .then(setClientInfo)
      .catch(console.error);
  }, [clientId]);

  const handleUpload = async () => {
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('http://localhost:8080/api/upload', {
          method: 'POST',
          body: formData,
        });
        const message = await response.text();
        if (response.ok) {
          alert(message);
          const depotMatch = message.match(/depot: (\w+)/);
          if (depotMatch) {
            setClientId(depotMatch[1]);
            localStorage.setItem('clientId', depotMatch[1]);
          }
          setFile(null);
        } else {
          alert('Error uploading file. Please check the file format.');
        }
      } catch (error) {
        console.error(error);
        alert('Error uploading file.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account information and upload investment data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>
            {clientInfo ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                    {clientInfo.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                    {clientInfo.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <p className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                    {new Date(clientInfo.birthDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-4">
                  <DocumentTextIcon className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No profile data yet</h3>
                <p className="text-gray-600">Upload your transaction data to populate your profile information.</p>
              </div>
            )}
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Data</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction Statement
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-200">
                  <input
                    id="file-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.md,.html,.docx"
                    disabled={isUploading}
                  />
                  <div className="space-y-0.5">
                    <div>
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {file ? file.name : 'Click to upload'}
                      </p>
                      <p className="text-xs text-gray-500">PDF, TXT, MD, HTML, DOCX</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full py-1.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 text-xs"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Processing...
                  </span>
                ) : (
                  'Upload & Process'
                )}
              </button>

              {file && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-xs text-green-700 font-medium">✓ Ready: {file.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;