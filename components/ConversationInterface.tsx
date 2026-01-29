
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SessionConfig, TranscriptionEntry } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio-helpers';
import Visualizer from './Visualizer';

interface Props {
  config: SessionConfig;
  onEnd: () => void;
}

const ConversationInterface: React.FC<Props> = ({ config, onEnd }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const transcriptionBufferRef = useRef<{ user: string; model: string }>({ user: '', model: '' });

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    activeSourcesRef.current.forEach(source => source.stop());
    activeSourcesRef.current.clear();
  }, []);

  const startLiveSession = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const systemInstruction = `
        You are an elite, patient, and friendly language tutor.
        Your goal is to help the user practice speaking in ${config.language}.
        The user is at a ${config.proficiency} proficiency level.
        The current scenario is: ${config.scenario}.
        
        Guidelines:
        1. Always respond in ${config.language} primarily. 
        2. If the user is a BEGINNER, keep your sentences short, simple, and speak slightly slower. 
        3. Provide corrections gently. If the user makes a significant mistake, rephrase what they said correctly in a natural follow-up.
        4. Engage in the roleplay of the scenario.
        5. Encourage the user to speak more.
        6. Occasionally provide a brief translation in English if they seem stuck or for complex terms, but keep focus on immersion.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live session opened');
            setStatus('listening');

            // Setup microphone input streaming
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setStatus('speaking');
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(ctx.destination);
              
              sourceNode.addEventListener('ended', () => {
                activeSourcesRef.current.delete(sourceNode);
                if (activeSourcesRef.current.size === 0) {
                  setStatus('listening');
                }
              });

              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(sourceNode);
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              transcriptionBufferRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionBufferRef.current.model += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const newEntries: TranscriptionEntry[] = [];
              if (transcriptionBufferRef.current.user) {
                newEntries.push({ role: 'user', text: transcriptionBufferRef.current.user, timestamp: Date.now() });
                transcriptionBufferRef.current.user = '';
              }
              if (transcriptionBufferRef.current.model) {
                newEntries.push({ role: 'model', text: transcriptionBufferRef.current.model, timestamp: Date.now() });
                transcriptionBufferRef.current.model = '';
              }
              setTranscriptions(prev => [...prev, ...newEntries]);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (err) => {
            console.error('Session Error:', err);
            setStatus('error');
            setErrorMsg('Connection lost. Please try again.');
          },
          onclose: () => {
            console.log('Session closed');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error('Failed to start session:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Could not access microphone or connect to AI.');
    }
  }, [config]);

  useEffect(() => {
    startLiveSession();
  }, [startLiveSession]);

  const transcriptionsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  return (
    <div className="w-full max-w-4xl h-[calc(100vh-12rem)] flex flex-col gap-6">
      {/* Session Controls & Visualizer */}
      <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center gap-6 border border-slate-100 relative overflow-hidden">
        {/* Abstract background gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">{config.language} Coach</h2>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mt-1">{config.scenario}</p>
        </div>

        <div className="relative h-48 w-48 flex items-center justify-center">
          {/* Audio Visualizer Rings */}
          <div className={`absolute inset-0 rounded-full border-4 transition-all duration-700 opacity-20 ${status === 'speaking' ? 'scale-110 border-indigo-400 animate-pulse' : 'scale-100 border-slate-200'}`}></div>
          <div className={`absolute inset-4 rounded-full border-2 transition-all duration-1000 opacity-30 ${status === 'listening' ? 'scale-105 border-green-400 animate-pulse' : 'scale-100 border-slate-100'}`}></div>
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            status === 'speaking' ? 'bg-indigo-600 shadow-indigo-200' : 
            status === 'listening' ? 'bg-emerald-500 shadow-emerald-200' : 
            status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
          }`}>
            <i className={`text-white text-5xl fa-solid ${
              status === 'speaking' ? 'fa-volume-high' : 
              status === 'listening' ? 'fa-microphone' : 
              status === 'connecting' ? 'fa-spinner fa-spin' : 'fa-circle-exclamation'
            }`}></i>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold capitalize flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              status === 'speaking' ? 'bg-indigo-500' : 
              status === 'listening' ? 'bg-emerald-500' : 
              status === 'connecting' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
            }`}></span>
            {status === 'speaking' ? 'AI is speaking...' : status === 'listening' ? 'Listening to you...' : status === 'connecting' ? 'Connecting...' : 'Something went wrong'}
          </span>
          <p className="text-slate-400 text-xs italic">Say something like "Hello!" to begin.</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onEnd}
            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-stop text-sm"></i>
            End Session
          </button>
        </div>
      </div>

      {/* Real-time Transcription Log */}
      <div className="flex-grow bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Conversation Log</span>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            <i className="fa-solid fa-download"></i>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {transcriptions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
              <i className="fa-solid fa-comments text-5xl"></i>
              <p className="font-medium">No transcriptions yet. Start talking!</p>
            </div>
          ) : (
            transcriptions.map((entry, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                  entry.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  {entry.role === 'user' ? 'You' : 'Coach'}
                </span>
              </div>
            ))
          )}
          <div ref={transcriptionsEndRef} />
        </div>
      </div>

      {/* Error Modal */}
      {status === 'error' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Connection Error</h3>
              <p className="text-slate-500 mt-2">{errorMsg || 'The voice session encountered an error. Please check your microphone and try again.'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setStatus('connecting'); setErrorMsg(null); startLiveSession(); }}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all"
              >
                Try Reconnecting
              </button>
              <button 
                onClick={onEnd}
                className="w-full text-slate-500 font-semibold py-3 hover:text-slate-700"
              >
                Go Back to Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationInterface;
