export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export function createPeerConnection(
  onTrack: (stream: MediaStream) => void,
  onCandidate: (candidate: RTCIceCandidateInit) => void,
  onStateChange?: (state: RTCPeerConnectionState) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_CONFIG);

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      onCandidate(e.candidate.toJSON());
    }
  };

  pc.ontrack = (e) => {
    if (e.streams?.[0]) {
      onTrack(e.streams[0]);
    }
  };

  if (onStateChange) {
    pc.onconnectionstatechange = () => {
      onStateChange(pc.connectionState);
    };
  }

  return pc;
}

export async function hostCreateOffer(
  pc: RTCPeerConnection,
  stream: MediaStream
): Promise<RTCSessionDescriptionInit> {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function handleOffer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function handleCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}
