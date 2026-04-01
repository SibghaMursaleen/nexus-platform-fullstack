import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Shield, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const initCall = async () => {
      try {
        // 1. Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Setup Socket
        socket.connect();
        socket.emit('join-room', roomId);

        // 3. Define Signaling Listeners
        socket.on('user-joined', async () => {
          console.log('User joined, creating offer...');
          const pc = createPeerConnection();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        });

        socket.on('offer', async (data: { offer: RTCSessionDescriptionInit, senderId: string }) => {
          console.log('Received offer...');
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer });
        });

        socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
          console.log('Received answer...');
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
          console.log('Received ICE candidate...');
          if (peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          }
        });

      } catch (err) {
        console.error('Call Error:', err);
        toast.error('Could not access camera or microphone');
      }
    };

    initCall();

    return () => {
      stopCall();
    };
  }, [roomId, user]);

  const createPeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track');
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    return pc;
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const stopCall = () => {
    // 1. Stop all media tracks (Crucial for turning off the cam light)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} stopped`);
      });
    }

    // 2. Close Peer Connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track) sender.track.stop();
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 3. Cleanup Socket and State
    socket.off('user-joined');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice-candidate');
    
    setLocalStream(null);
    setRemoteStream(null);
    console.log('Call resources released');
  };

  const handleEndCall = () => {
    stopCall();
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 min-h-0">
        {/* Local Video */}
        <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-xl border-2 border-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white text-xs font-medium">{user?.name} (You)</span>
          </div>
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
                <VideoOff size={32} className="text-gray-500" />
              </div>
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-xl border-2 border-primary-500/20">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {remoteStream ? (
            <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <span className="text-white text-xs font-medium">Remote Participant</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 space-y-4">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm font-medium">Waiting for participant...</p>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <Card className="bg-white/80 backdrop-blur-md border border-gray-200">
        <CardBody className="py-4 px-8 flex items-center justify-center space-x-4">
          <Button
            variant={isAudioOn ? 'secondary' : 'error'}
            className="w-12 h-12 p-0 rounded-full transition-all hover:scale-105"
            onClick={toggleAudio}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </Button>
          
          <Button
            variant={isVideoOn ? 'secondary' : 'error'}
            className="w-12 h-12 p-0 rounded-full transition-all hover:scale-105"
            onClick={toggleVideo}
            title={isVideoOn ? 'Disable Video' : 'Enable Video'}
          >
            {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </Button>

          <Button
            variant="error"
            className="px-8 rounded-full font-bold flex items-center space-x-2 transition-all hover:scale-105 shadow-lg shadow-error-500/20"
            onClick={handleEndCall}
          >
            <PhoneOff size={20} />
            <span>End Call</span>
          </Button>

          <div className="hidden md:flex ml-auto items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 font-medium">Meeting ID</span>
              <span className="text-sm font-bold text-gray-900">{roomId}</span>
            </div>
            <div className="h-10 w-[1px] bg-gray-200"></div>
            <div className="flex items-center space-x-3">
              <MessageSquare size={20} className="text-gray-400 cursor-pointer hover:text-primary-500" />
              <Users size={20} className="text-gray-400 cursor-pointer hover:text-primary-500" />
              <Shield size={20} className="text-green-500" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
