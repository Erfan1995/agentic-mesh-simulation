import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Share2, 
  Monitor, 
  Activity, 
  BrainCircuit, 
  Bot, 
  CheckCircle2, 
  X, 
  Database, 
  ShieldCheck, 
  Zap,
  Sparkles,
  FileText,
  Loader2
} from 'lucide-react';

// --- Types ---

type AgentType = 'Orchestrator' | 'Specialist' | 'Worker';
type AgentStatus = 'idle' | 'working' | 'communicating' | 'success';

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  x: number;
  y: number;
  status: AgentStatus;
  specialty: string;
  currentTask?: string; // New: Dynamic task description
}

interface LogEntry {
  id: number;
  source: string;
  message: string;
  timestamp: string;
}

// --- Gemini API Helper ---

// Read API key from Vite env at runtime. Set VITE_GEMINI_API_KEY in .env.local or environment.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

async function callGeminiOrchestrator(mission: string) {
  const systemPrompt = `
    You are the Orchestration Brain of an Agentic Mesh. 
    The user has a mission: "${mission}".
    Identify 3 distinct specialist agent roles needed to accomplish this mission.
    Return ONLY valid JSON in this format:
    {
      "agents": [
        { "name": "Agent Name", "specialty": "Primary Skill", "task": "Specific action they will perform" },
        { "name": "Agent Name", "specialty": "Primary Skill", "task": "Specific action they will perform" },
        { "name": "Agent Name", "specialty": "Primary Skill", "task": "Specific action they will perform" }
      ]
    }
  `;

  try {
    if (!apiKey) throw new Error('No API key provided');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) throw new Error('API Call Failed');
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback for demo stability if API fails
    return {
      agents: [
        { name: "Logic Bot", specialty: "Planning", task: "Analyzing requirements" },
        { name: "Resource Bot", specialty: "Logistics", task: "Gathering resources" },
        { name: "Review Bot", specialty: "Quality Control", task: "Verifying output" }
      ]
    };
  }
}

async function callGeminiSummary(logs: LogEntry[]) {
  const logText = logs.map(l => `[${l.source}]: ${l.message}`).join('\n');
  const prompt = `
    Summarize this agentic workflow execution in 2-3 sentences. 
    Highlight how the agents collaborated.
    Logs:
    ${logText}
  `;

  try {
    if (!apiKey) throw new Error('No API key provided');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    return "Mission completed successfully. Agents collaborated to fulfill the user request.";
  }
}

// --- Components ---

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="group relative flex flex-col items-center">
    {children}
    <div className="absolute bottom-full mb-2 hidden w-48 flex-col items-center group-hover:flex z-50">
      <div className="rounded bg-slate-800 p-2 text-xs text-white shadow-lg text-center">
        {text}
      </div>
      <div className="-mt-1 h-2 w-2 rotate-45 bg-slate-800"></div>
    </div>
  </div>
);

// --- Main Application ---

export default function AgenticMeshSimulation() {
  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [userMission, setUserMission] = useState("Plan a 3-day trip to Tokyo");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [missionReport, setMissionReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Constants for layout
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const CENTER_X = CANVAS_WIDTH / 2;
  const CENTER_Y = CANVAS_HEIGHT / 2;

  // Initialize Agents (Default State)
  useEffect(() => {
    resetSimulation();
  }, []);

  // Logger Helper
  const addLog = (source: string, message: string) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    // FIX: Ensure unique ID even if logs happen in same millisecond
    const uniqueId = Date.now() + Math.random(); 
    setLogs(prev => [{ id: uniqueId, source, message, timestamp: timeString }, ...prev].slice(0, 8));
  };

  // Simulation Logic
  const startSimulation = async () => {
    if (isSimulating || isOrchestrating) return;
    
    setIsOrchestrating(true);
    setMissionReport(null);
    setSimulationStep(0);
    setLogs([]); // Clear previous logs
    
    addLog('User', `Request received: "${userMission}"`);
    addLog('Orchestrator LLM', 'Consulting Gemini API for agent decomposition...');

    // 1. Call Gemini to get dynamic agents
    const orchestratorPlan = await callGeminiOrchestrator(userMission);
    
    // 2. Map Gemini response to our visual agents
    // We keep Agent 1 as the Lead Orchestrator, and update 2, 3, 4 based on AI.
    // Agent 5 stays as a generic support bot for visual balance.
    setAgents(prev => {
      const newAgents = [...prev];
      // Update Specialist 1 (Agent 2)
      if (orchestratorPlan.agents[0]) {
        newAgents[1] = { ...newAgents[1], name: orchestratorPlan.agents[0].name, specialty: orchestratorPlan.agents[0].specialty, currentTask: orchestratorPlan.agents[0].task };
      }
      // Update Specialist 2 (Agent 3)
      if (orchestratorPlan.agents[1]) {
        newAgents[2] = { ...newAgents[2], name: orchestratorPlan.agents[1].name, specialty: orchestratorPlan.agents[1].specialty, currentTask: orchestratorPlan.agents[1].task };
      }
      // Update Worker 1 (Agent 4)
      if (orchestratorPlan.agents[2]) {
        newAgents[3] = { ...newAgents[3], name: orchestratorPlan.agents[2].name, specialty: orchestratorPlan.agents[2].specialty, currentTask: orchestratorPlan.agents[2].task };
      }
      return newAgents;
    });

    setIsOrchestrating(false);
    setIsSimulating(true);
    setSimulationStep(1);

    // Step 1: Orchestration Display
    setTimeout(() => {
      setSimulationStep(2);
      updateAgentStatus('1', 'working');
      addLog('Orchestrator LLM', `Decomposed mission. Assigning roles: ${orchestratorPlan.agents.map((a: any) => a.name).join(', ')}.`);
    }, 1500);

    // Step 2: Discovery
    setTimeout(() => {
      setSimulationStep(3);
      addLog('Registry', `Lookup successful: Found specialized agents for ${orchestratorPlan.agents[0].specialty} and ${orchestratorPlan.agents[1].specialty}.`);
    }, 3500);

    // Step 3: Distribution
    setTimeout(() => {
      setSimulationStep(4);
      updateAgentStatus('1', 'communicating');
      updateAgentStatus('2', 'working');
      updateAgentStatus('3', 'working');
      updateAgentStatus('4', 'working');
      addLog('Mesh', 'Task protocols distributed to agents.');
    }, 5500);

    // Step 4: Execution
    setTimeout(() => {
      setSimulationStep(5);
      updateAgentStatus('2', 'communicating');
      updateAgentStatus('5', 'working');
      addLog(orchestratorPlan.agents[0].name, `${orchestratorPlan.agents[0].task} - Complete.`);
      addLog(orchestratorPlan.agents[1].name, `${orchestratorPlan.agents[1].task} - In Progress.`);
    }, 8500);

    // Step 5: Completion
    setTimeout(() => {
      setSimulationStep(6);
      setAgents(prev => prev.map(a => ({ ...a, status: 'success' })));
      addLog('Monitor', 'Workflow completed successfully. Results aggregated.');
      setIsSimulating(false);
    }, 11500);
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    const summary = await callGeminiSummary(logs);
    setMissionReport(summary);
    setIsGeneratingReport(false);
  };

  const updateAgentStatus = (id: string, status: AgentStatus) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const resetSimulation = () => {
    const initialAgents: Agent[] = [
      { id: '1', name: 'Orchestrator', type: 'Orchestrator', x: CENTER_X, y: CENTER_Y, status: 'idle', specialty: 'Coordination', currentTask: 'Awaiting Mission' },
      { id: '2', name: 'Specialist A', type: 'Specialist', x: CENTER_X - 100, y: CENTER_Y - 80, status: 'idle', specialty: 'Pending...', currentTask: 'Standby' },
      { id: '3', name: 'Specialist B', type: 'Specialist', x: CENTER_X + 100, y: CENTER_Y - 80, status: 'idle', specialty: 'Pending...', currentTask: 'Standby' },
      { id: '4', name: 'Worker A', type: 'Worker', x: CENTER_X - 120, y: CENTER_Y + 60, status: 'idle', specialty: 'Pending...', currentTask: 'Standby' },
      { id: '5', name: 'Support Bot', type: 'Worker', x: CENTER_X + 120, y: CENTER_Y + 60, status: 'idle', specialty: 'Utilities', currentTask: 'Standby' },
    ];
    setAgents(initialAgents);
    setSimulationStep(0);
    setLogs([]);
    setMissionReport(null);
    addLog('System', 'Agentic Mesh Online. Enter a mission to begin.');
  };

  // --- Render Helpers ---

  const getAgentColor = (status: AgentStatus, type: AgentType) => {
    if (status === 'success') return 'bg-green-500 border-green-300';
    if (status === 'working') return 'bg-amber-400 border-amber-200 animate-pulse';
    if (status === 'communicating') return 'bg-blue-500 border-blue-300 animate-pulse';
    return type === 'Orchestrator' ? 'bg-purple-600 border-purple-400' : 'bg-slate-600 border-slate-400';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
             <Share2 className="text-blue-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Agentic Mesh Simulator</h1>
            <p className="text-slate-500 text-xs flex items-center gap-1">
              Powered by <Sparkles className="w-3 h-3 text-amber-500" /> Gemini API
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              value={userMission}
              onChange={(e) => setUserMission(e.target.value)}
              placeholder="Enter a mission (e.g., 'Plan a wedding', 'Debug code')..."
              className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
              disabled={isSimulating || isOrchestrating}
            />
            {isOrchestrating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          
          <button 
            onClick={startSimulation}
            disabled={isSimulating || isOrchestrating || !userMission}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white shadow-md transition-all font-medium 
              ${(isSimulating || isOrchestrating) ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'}`}
          >
            {isOrchestrating ? 'Orchestrating...' : isSimulating ? 'Running...' : (
              <>
                <Sparkles className="h-4 w-4 fill-amber-300 text-amber-300" />
                Start Mission
              </>
            )}
          </button>
          
          <button 
            onClick={resetSimulation}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-slate-200"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        
        {/* LEFT PANEL: External Dependencies */}
        <div className="w-64 bg-slate-100 border-r border-slate-200 p-6 flex flex-col gap-8 z-10 shadow-inner">
          <Tooltip text="A library of available agent capabilities that can be discovered dynamically.">
            <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${simulationStep === 3 ? 'bg-blue-50 border-blue-400 scale-105 shadow-md' : 'bg-white border-slate-300'}`}>
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className={`h-6 w-6 ${simulationStep === 3 ? 'text-blue-600' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-700">Marketplace</h3>
              </div>
              <p className="text-xs text-slate-500">Discoverable capabilities & skills</p>
            </div>
          </Tooltip>

          <Tooltip text="The phonebook of the mesh. Agents look up who can help them here.">
            <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${simulationStep === 3 ? 'bg-indigo-50 border-indigo-400 scale-105 shadow-md' : 'bg-white border-slate-300'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Database className={`h-6 w-6 ${simulationStep === 3 ? 'text-indigo-600' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-700">Registry</h3>
              </div>
              <p className="text-xs text-slate-500">Agent identity & address book</p>
            </div>
          </Tooltip>

          {/* New Feature Info */}
          <div className="mt-auto p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="text-amber-800 font-bold text-xs flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3" /> Gemini Integrated
            </h4>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              The Orchestrator now uses the Gemini API to dynamically assign roles based on your mission input.
            </p>
          </div>
        </div>

        {/* CENTER PANEL: The Mesh */}
        <div className="flex-1 relative bg-slate-50 overflow-hidden cursor-crosshair">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
               }}>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw lines from center to others */}
            {agents.slice(1).map((agent, i) => (
              <g key={`line-${i}`}>
                 {/* Connection to Orchestrator */}
                <line 
                  x1={agents[0].x} 
                  y1={agents[0].y} 
                  x2={agent.x} 
                  y2={agent.y} 
                  stroke={simulationStep >= 4 ? "#3b82f6" : "#cbd5e1"} 
                  strokeWidth={simulationStep >= 4 ? "2" : "1"}
                  strokeDasharray={simulationStep >= 4 ? "5,5" : "0"}
                  className="transition-all duration-1000"
                />
                {/* Data packets */}
                {simulationStep === 4 && (
                  <circle r="4" fill="#3b82f6">
                    <animateMotion 
                      dur="1s" 
                      repeatCount="indefinite"
                      path={`M${agents[0].x},${agents[0].y} L${agent.x},${agent.y}`} 
                    />
                  </circle>
                )}
                 {/* Return packets */}
                 {simulationStep === 5 && (
                  <circle r="4" fill="#10b981">
                    <animateMotion 
                      dur="1s" 
                      repeatCount="indefinite"
                      path={`M${agent.x},${agent.y} L${agents[0].x},${agents[0].y}`} 
                    />
                  </circle>
                )}
              </g>
            ))}
          </svg>

          {/* Agents */}
          <div className="relative w-full h-full">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 hover:scale-110 group`}
                style={{ left: agent.x, top: agent.y }}
              >
                {/* Agent Body */}
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg bg-white relative z-10 transition-colors duration-500 ${getAgentColor(agent.status, agent.type)}`}>
                  <Bot className={`h-8 w-8 transition-colors duration-500 ${agent.status === 'success' || agent.type === 'Orchestrator' ? 'text-white' : 'text-slate-400'}`} />
                  
                  {/* Status Indicator Badge */}
                  {agent.status !== 'idle' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                      {agent.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Activity className="w-3 h-3 text-blue-500 animate-pulse"/>}
                    </div>
                  )}
                </div>

                {/* Agent Label */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-700 whitespace-nowrap shadow-sm backdrop-blur-sm border border-slate-200 flex flex-col items-center">
                  <span>{agent.name}</span>
                  {agent.specialty !== 'Pending...' && (
                    <span className="text-[10px] font-normal text-slate-500">{agent.specialty}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Area: LLMs */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-20">
             <Tooltip text="The 'Big Brain' (Gemini) that decomposes your request into tasks.">
                <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${simulationStep === 2 || isOrchestrating ? 'bg-purple-100 scale-110 ring-2 ring-purple-300' : ''}`}>
                  <BrainCircuit className={`w-10 h-10 transition-colors ${simulationStep === 2 || isOrchestrating ? 'text-purple-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-600">Orchestration LLM</span>
                </div>
             </Tooltip>
             <Tooltip text="Specialized models helping agents execute specific tasks.">
                <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${simulationStep === 5 ? 'bg-teal-100 scale-110' : ''}`}>
                  <BrainCircuit className={`w-10 h-10 transition-colors ${simulationStep === 5 ? 'text-teal-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-600">Specialist LLM</span>
                </div>
             </Tooltip>
          </div>
        </div>

        {/* RIGHT PANEL: Monitor & Logs */}
        <div className="w-80 bg-slate-100 border-l border-slate-200 p-6 flex flex-col gap-6 z-10 shadow-inner">
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-4 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Monitor className="text-slate-500 h-5 w-5" />
              <h3 className="font-bold text-slate-700">System Monitor</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="text-xs p-2 rounded bg-slate-50 border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="font-mono font-bold text-[10px] uppercase">{log.source}</span>
                    <span className="text-[10px]">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-700 font-medium leading-relaxed">
                    {log.message}
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-center text-slate-400 text-xs italic mt-10">System Ready</div>}
            </div>

            {/* AI Report Button */}
            {simulationStep === 6 && !missionReport && (
               <button 
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors flex justify-center items-center gap-2"
               >
                 {isGeneratingReport ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                 Generate Mission Report
               </button>
            )}

            {/* AI Report Result */}
            {missionReport && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700">Gemini Summary</span>
                 </div>
                 <p className="text-xs text-indigo-800 leading-relaxed italic">
                    "{missionReport}"
                 </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-slate-500" />
                <h4 className="font-bold text-slate-700 text-sm">Interactions</h4>
             </div>
             <p className="text-xs text-slate-500">
                Visualizing Real-time protocol exchanges between {agents.filter(a => a.status !== 'idle').length || 0} active agents.
             </p>
          </div>
        </div>
      </main>

      {/* MODAL: MicroAgent Deep Dive (Image 2) */}
      {selectedAgent && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <Bot className="text-blue-600 h-8 w-8" />
                  {selectedAgent.name}
                  <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                    {selectedAgent.type}
                  </span>
                </h2>
                <div className="flex gap-4 mt-2 text-sm">
                   <p className="text-slate-500">Status: <span className="font-medium text-slate-800 capitalize">{selectedAgent.status}</span></p>
                   {selectedAgent.currentTask && (
                     <p className="text-slate-500">Current Task: <span className="font-medium text-blue-600">{selectedAgent.currentTask}</span></p>
                   )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Content: The MicroAgent Architecture Diagram Recreated */}
            <div className="p-8 bg-slate-50">
              
              {/* Outer Container (Grey Box in diagram) */}
              <div className="bg-slate-200 p-6 rounded-3xl border-4 border-slate-300 shadow-inner">
                <h3 className="text-center text-slate-500 font-bold mb-4 uppercase tracking-wider text-sm">Microservice / Container</h3>
                
                {/* Endpoints */}
                <div className="bg-slate-600 text-white text-center py-2 rounded-t-lg font-bold text-sm mb-1 shadow-sm mx-4">
                  API Endpoints / gRPC
                </div>

                {/* Foundational Capabilities (Green Box) */}
                <div className="bg-green-600 p-4 rounded-xl shadow-lg mb-4 text-white">
                   <h4 className="text-center font-bold mb-4 flex items-center justify-center gap-2">
                     <ShieldCheck className="w-5 h-5" /> Foundational Capabilities
                   </h4>
                   
                   <div className="space-y-3">
                      {/* Row 1: Core */}
                      <div className="bg-green-700/50 p-2 rounded-lg">
                        <div className="text-xs text-green-100 text-center mb-1 font-semibold uppercase">Core Capabilities</div>
                        <div className="grid grid-cols-4 gap-2">
                           {['Discoverability', 'Observability', 'Operability', 'Trust Fmwk'].map(item => (
                             <div key={item} className="bg-white text-green-800 text-xs font-bold py-2 px-1 rounded text-center shadow-sm">
                               {item}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Row 2: Security */}
                      <div className="bg-green-700/50 p-2 rounded-lg">
                        <div className="text-xs text-green-100 text-center mb-1 font-semibold uppercase">Security</div>
                        <div className="grid grid-cols-3 gap-2">
                           {['mTLS', 'OAUTH2', 'Identity Integration'].map(item => (
                             <div key={item} className="bg-white text-green-800 text-xs font-bold py-2 px-1 rounded text-center shadow-sm">
                               {item}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Row 3: Collaboration */}
                      <div className="bg-green-700/50 p-2 rounded-lg">
                        <div className="text-xs text-green-100 text-center mb-1 font-semibold uppercase">Collaboration</div>
                        <div className="grid grid-cols-4 gap-2">
                           {['Discovery', 'Protocol', 'State Mgmt', 'Interactions'].map(item => (
                             <div key={item} className="bg-white text-green-800 text-xs font-bold py-2 px-1 rounded text-center shadow-sm">
                               {item}
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Task Management (Blue Box) */}
                <div className={`bg-blue-600 p-4 rounded-xl shadow-lg mb-4 text-white transition-opacity ${selectedAgent.status === 'working' ? 'opacity-100 ring-4 ring-blue-300' : 'opacity-90'}`}>
                   <h4 className="text-center font-bold mb-3 flex items-center justify-center gap-2">
                      <Activity className="w-5 h-5" /> Task Management
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className={`bg-white text-blue-700 font-bold py-3 rounded-lg text-center shadow-sm ${selectedAgent.status === 'working' ? 'animate-pulse' : ''}`}>
                        Task Planning
                      </div>
                      <div className="bg-white text-blue-700 font-bold py-3 rounded-lg text-center shadow-sm">
                        Task Execution
                      </div>
                   </div>
                   {/* Dynamic Task Info */}
                   {selectedAgent.currentTask && selectedAgent.status === 'working' && (
                     <div className="mt-2 bg-blue-800/50 p-2 rounded text-xs text-center border border-blue-400/50">
                       Executing: {selectedAgent.currentTask}
                     </div>
                   )}
                </div>

                {/* Intelligence (Dark Blue Box) */}
                <div className={`bg-sky-700 p-4 rounded-xl shadow-lg text-white transition-opacity ${selectedAgent.status === 'working' ? 'opacity-100 ring-4 ring-sky-300' : 'opacity-90'}`}>
                   <h4 className="text-center font-bold mb-3 flex items-center justify-center gap-2">
                      <BrainCircuit className="w-5 h-5" /> Intelligence
                   </h4>
                   <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white text-sky-800 text-xs font-bold py-2 rounded text-center shadow-sm flex flex-col items-center justify-center h-16">
                        <Zap className="w-4 h-4 mb-1" />
                        Problem Solving
                      </div>
                      <div className="bg-white text-sky-800 text-xs font-bold py-2 rounded text-center shadow-sm flex flex-col items-center justify-center h-16">
                        <span className="text-[10px] leading-tight">Learning / Adaptation</span>
                      </div>
                      <div className="bg-white text-sky-800 text-xs font-bold py-2 rounded text-center shadow-sm flex flex-col items-center justify-center h-16">
                         <span className="text-[10px] leading-tight">Memory / History</span>
                      </div>
                      <div className="bg-white text-sky-800 text-xs font-bold py-2 rounded text-center shadow-sm flex flex-col items-center justify-center h-16">
                        Tools
                      </div>
                   </div>
                </div>

              </div>
              <div className="mt-4 text-center text-slate-500 text-sm italic">
                Click 'X' or outside to close detailed view
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
