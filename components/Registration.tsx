import React, { useRef, useState, useEffect } from 'react';
import { Student } from '../types';
import { saveStudent } from '../services/storage';
import { Upload, Camera, RefreshCw } from 'lucide-react';

const Registration: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [section, setSection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setIsCameraReady(false);
        // Ensure previous stream is stopped
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error("Camera access error:", err);
        // Only show error if we haven't uploaded a photo manually
        if (mounted && !photo) {
          setError("Unable to access camera. You can upload a photo instead.");
        }
      }
    };

    // Only start camera if we don't have a photo yet
    if (!photo) {
      startCamera();
    } else {
      // If we have a photo, stop the stream to save resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [photo]);

  const capturePhoto = () => {
    if (videoRef.current && isCameraReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the raw frame (not mirrored) so the ID card/text is readable if visible
        ctx.drawImage(videoRef.current, 0, 0);
        // High quality for registration to improve matching accuracy
        setPhoto(canvas.toDataURL('image/jpeg', 0.95));
      }
    } else {
        setError("Camera is not ready yet. Please wait.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
             // Resize to standard resolution to ensure consistency and manageable file size
             const canvas = document.createElement('canvas');
             const MAX_WIDTH = 1280;
             const MAX_HEIGHT = 960;
             
             let width = img.width;
             let height = img.height;

             if (width > height) {
               if (width > MAX_WIDTH) {
                 height *= MAX_WIDTH / width;
                 width = MAX_WIDTH;
               }
             } else {
               if (height > MAX_HEIGHT) {
                 width *= MAX_HEIGHT / height;
                 height = MAX_HEIGHT;
               }
             }

             canvas.width = width;
             canvas.height = height;
             
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(img, 0, 0, width, height);
                 setPhoto(canvas.toDataURL('image/jpeg', 0.95));
                 setError(null);
             }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRegister = () => {
    if (!name || !studentId || !studentClass || !section || !photo) {
      setError("Please fill all fields and capture or upload a photo.");
      return;
    }
    const newStudent: Student = {
      id: studentId,
      name,
      studentClass,
      section,
      photoData: photo,
      registeredAt: new Date().toISOString()
    };
    saveStudent(newStudent);
    onComplete();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">New Student Registration</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input 
              type="text" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 2024001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <input 
                type="text" 
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <input 
                type="text" 
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. A"
              />
            </div>
          </div>

          <div className="pt-4">
             <button 
              onClick={handleRegister}
              disabled={!photo || !name || !studentId || !studentClass || !section}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${(!photo || !name || !studentId || !studentClass || !section) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
            >
              Complete Registration
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
           <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden mb-3 border-2 border-gray-300 flex items-center justify-center shadow-inner group">
              {!photo ? (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`} 
                />
              ) : (
                <img src={photo} alt="Captured" className="w-full h-full object-cover" />
              )}
              
              {!photo && !isCameraReady && !error && (
                 <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Starting Camera...
                 </div>
              )}
              
              {!photo && isCameraReady && (
                 <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Preview Mode</span>
                 </div>
              )}
           </div>
           
           {/* Controls */}
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*" 
           />

           {!photo ? (
             <div className="flex gap-2 w-full">
               <button
                 onClick={capturePhoto}
                 disabled={!isCameraReady}
                 className={`flex-1 py-2 px-4 rounded-md text-white flex items-center justify-center gap-2 transition-colors ${isCameraReady ? 'bg-gray-800 hover:bg-gray-900' : 'bg-gray-400 cursor-wait'}`}
               >
                 <Camera className="w-5 h-5" />
                 Capture
               </button>
               <button
                 onClick={triggerFileUpload}
                 className="flex-1 py-2 px-4 rounded-md bg-white border border-gray-300 text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
               >
                 <Upload className="w-5 h-5" />
                 Upload
               </button>
             </div>
           ) : (
             <button
               onClick={() => setPhoto(null)}
               className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
             >
               <RefreshCw className="w-4 h-4" />
               Retake / Clear
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

// Add Loader2 definition locally if needed, or import from lucide-react (it was missing in previous import)
import { Loader2 } from 'lucide-react';

export default Registration;