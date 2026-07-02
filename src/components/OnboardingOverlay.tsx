import React, { useState, useEffect } from 'react';
import { Hand, Settings2, Link as LinkIcon, X } from 'lucide-react';

const steps = [
  {
    title: 'Reverb Factory',
    description: 'Design custom reverb algorithms directly on your phone using modular DSP blocks.',
    icon: <Hand size={48} className="text-blue-500 mb-6" />,
  },
  {
    title: 'Connecting Modules',
    description: 'Tap an output port (right) then tap an input port (left) to connect them. They will snap together seamlessly.',
    icon: <LinkIcon size={48} className="text-purple-500 mb-6" />,
  },
  {
    title: 'Editing Parameters',
    description: 'Select any module to open the properties panel and precisely tweak its DSP constraints.',
    icon: <Settings2 size={48} className="text-emerald-500 mb-6" />,
  }
];

export function OnboardingOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('reverb_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      close();
    }
  };

  const close = () => {
    setIsVisible(false);
    localStorage.setItem('reverb_onboarding_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={close}
      />
      <div className="bg-slate-900 border border-slate-700/50 rounded-[2rem] w-full max-w-sm px-6 py-8 shadow-2xl relative z-10 overflow-hidden flex flex-col min-h-[400px] animate-in fade-in zoom-in duration-300">
        <button 
          onClick={close} 
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 z-20 transition-colors p-1"
        >
          <X size={24} />
        </button>
        
        <div className="flex-1 relative mt-4">
          <div className="flex flex-col items-center text-center justify-center px-2 transition-all duration-300">
            {steps[currentStep].icon}
            <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">{steps[currentStep].title}</h2>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium min-h-[5rem]">{steps[currentStep].description}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center space-y-8 z-20">
          <div className="flex space-x-2.5">
            {steps.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}`} 
              />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] uppercase tracking-wider text-sm"
          >
           {currentStep === steps.length - 1 ? "Start Building" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
