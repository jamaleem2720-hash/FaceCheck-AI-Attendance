import React, { useRef, useState, useEffect } from 'react';
import { Student } from '../types';
import { getStudents, markAttendance } from '../services/storage';
import { identifyStudent, identifyGroup } from '../services/gemini';
import { Loader2, CheckCircle, XCircle, Camera, Upload, RefreshCw, Users, User, Info } from 'lucide-react';

const AttendanceScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'single' | 'group'>('single');
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'fail' | 'partial'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Single mode result
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  
  // Group mode results
  const [groupResults, setGroupResults] = useState<{name: string, studentClass?: string, section?: string, status: 'marked' | 'already_marked'}[]>([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Manage Camera Lifecycle based on upload state
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        
        setIsCameraReady(false);
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        if (!mounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (mounted) {
            setStatusMessage("Camera access failed. Check permissions.");
            setStatus('fail');
        }
      }
    };

    if (!uploadedImage) {
        startCamera();
    } else {
        // Stop camera if image is uploaded
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsCameraReady(false);
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [uploadedImage]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setStatus('idle');
        setMatchedStudent(null);
        setGroupResults([]);
        setStatusMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const resetScan = () => {
    setStatus('idle');
    setMatchedStudent(null);
    setGroupResults([]);
    setStatusMessage('');
  };

  const handleScan = async () => {
    if ((!videoRef.current && !uploadedImage) || (!isCameraReady && !uploadedImage)) return;

    setIsScanning(true);
    resetScan();
    setStatusMessage(mode === 'single' ? 'Analyzing face...' : 'Analyzing class photo...');

    let currentFrame = uploadedImage;

    // If no uploaded image, capture from video
    if (!currentFrame && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setIsScanning(false);
          return;
        }

        // Capture raw image (not mirrored) for AI processing
        ctx.drawImage(videoRef.current, 0, 0);
        // High quality for better recognition
        currentFrame = canvas.toDataURL('image/jpeg', 0.95);
    }

    if (!currentFrame) {
        setIsScanning(false);
        return;
    }

    const students = getStudents();

    if (students.length === 0) {
      setStatus('fail');
      setStatusMessage("No students registered in database.");
      setIsScanning(false);
      return;
    }

    try {
      if (mode === 'single') {
        const result = await identifyStudent(currentFrame, students);

        if (result.matchFound && result.studentId) {
          const student = students.find(s => s.id === result.studentId);
          if (student) {
            const record = markAttendance(student.id, result.confidence || 0);
            if (record) {
              setStatus('success');
              setStatusMessage(`Marked Present: ${student.name}`);
              setMatchedStudent(student);
            } else {
              setStatus('success'); 
              setStatusMessage(`Already Marked Today: ${student.name}`);
              setMatchedStudent(student);
            }
          } else {
            setStatus('fail');
            setStatusMessage("ID match returned but student not found locally.");
          }
        } else {
          setStatus('fail');
          // If reasoning exists in the future, we could show it, but for now generic message
          setStatusMessage("Face not recognized. Try better lighting.");
        }
      } else {
        // Group Mode
        const result = await identifyGroup(currentFrame, students);
        
        if (result.identifiedStudentIds.length > 0) {
           const results: {name: string, studentClass?: string, section?: string, status: 'marked' | 'already_marked'}[] = [];
           
           result.identifiedStudentIds.forEach(id => {
              const student = students.find(s => s.id === id);
              if (student) {
                 const record = markAttendance(student.id, 0.9); // Assume high confidence for group matches
                 results.push({
                   name: student.name,
                   studentClass: student.studentClass,
                   section: student.section,
                   status: record ? 'marked' : 'already_marked'
                 });
              }
           });

           setGroupResults(results);
           setStatus('success');
           setStatusMessage(`Found ${results.length} student${results.length !== 1 ? 's' : ''}`);
        } else {
           setStatus('fail');
           setStatusMessage("No registered students found in this image.");
        }
      }

    } catch (e) {
      console.error(e);
      setStatus('fail');
      setStatusMessage("Recognition failed. Please try again.");
    }

    setIsScanning(false);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
      
      {/* Mode Toggle */}
      <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm w-full max-w-sm">
        <button
          onClick={() => { setMode('single'); resetScan(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'single' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <User className="w-4 h-4" />
          Single Student
        </button>
        <button
          onClick={() => { setMode('group'); resetScan(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'group' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" />
          Class Group
        </button>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
        {uploadedImage ? (
             <img 
               src={uploadedImage} 
               alt="Uploaded" 
               className="w-full h-full object-contain bg-gray-900"
             />
        ) : (
            <>
                <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onLoadedMetadata={() => setIsCameraReady(true)}
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`} 
                />
                {!isCameraReady && status !== 'fail' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                )}
            </>
        )}
        
        {isScanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="flex flex-col items-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mb-2 text-indigo-400" />
              <p className="font-semibold text-lg tracking-wide">
                 {mode === 'single' ? 'Scanning Biometrics...' : 'Analyzing Group Photo...'}
              </p>
            </div>
          </div>
        )}

        {/* Single Match Success */}
        {mode === 'single' && status === 'success' && matchedStudent && !isScanning && (
          <div className="absolute bottom-4 left-4 right-4 bg-green-500/90 backdrop-blur-md p-4 rounded-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 z-20">
             <img src={matchedStudent.photoData} alt="Match" className="w-12 h-12 rounded-full border-2 border-white" />
             <div className="text-white">
               <p className="font-bold text-lg">{matchedStudent.name}</p>
               <p className="text-sm opacity-90">{statusMessage}</p>
               {matchedStudent.studentClass && (
                   <p className="text-xs opacity-75 mt-1">{matchedStudent.studentClass} {matchedStudent.section}</p>
               )}
             </div>
             <CheckCircle className="ml-auto h-8 w-8 text-white" />
          </div>
        )}

        {/* Group Match Success Overlay */}
        {mode === 'group' && status === 'success' && groupResults.length > 0 && !isScanning && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm p-6 overflow-y-auto flex flex-col z-20">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <CheckCircle className="text-green-400 w-5 h-5" />
                    Scan Complete
                  </h3>
                  <button onClick={resetScan} className="text-gray-300 hover:text-white">
                    <XCircle className="w-6 h-6" />
                  </button>
              </div>
              <p className="text-gray-300 text-sm mb-4">Successfully identified {groupResults.length} students.</p>
              
              <div className="space-y-2">
                 {groupResults.map((res, idx) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-3 flex justify-between items-center text-white border border-white/10">
                       <div className="flex flex-col">
                           <span className="font-medium">{res.name}</span>
                           {(res.studentClass || res.section) && (
                               <span className="text-xs text-gray-400">{res.studentClass} {res.section}</span>
                           )}
                       </div>
                       <span className={`text-xs px-2 py-1 rounded ${res.status === 'marked' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                         {res.status === 'marked' ? 'Present' : 'Recorded'}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {status === 'fail' && !isScanning && (
           <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-md p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-20">
             <XCircle className="h-8 w-8 text-white" />
             <p className="text-white font-medium">{statusMessage}</p>
           </div>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={handleScan}
            disabled={isScanning || (!isCameraReady && !uploadedImage)}
            className={`
            flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all w-full
            ${isScanning || (!isCameraReady && !uploadedImage)
                ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white'
            }
            `}
          >
            <Camera className="w-6 h-6" />
            {isScanning ? 'Processing...' : (mode === 'single' ? 'Scan Attendance' : 'Scan Class Photo')}
          </button>

          <div className="flex gap-3">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
             />
             
             <button
                onClick={triggerFileUpload}
                disabled={isScanning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
             >
                <Upload className="w-5 h-5" />
                Upload Photo
             </button>

             {uploadedImage && (
                 <button
                    onClick={() => setUploadedImage(null)}
                    disabled={isScanning}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-gray-200 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors shadow-sm"
                 >
                    <RefreshCw className="w-5 h-5" />
                    Use Camera
                 </button>
             )}
          </div>
      </div>
      
      {mode === 'group' && (
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-500" />
            <p>For best group results, upload a high-resolution photo where all faces are clearly visible.</p>
          </div>
      )}
    </div>
  );
};

export default AttendanceScanner;