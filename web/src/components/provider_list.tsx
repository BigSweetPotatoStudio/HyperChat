import React from "react"

interface ModelItemProps {
  icon: React.ReactNode
  name: string
  isActive?: boolean
}

const ModelItem = ({ icon, name, isActive = false }: ModelItemProps) => {
  return (
    <div className="flex items-center px-3 py-2 hover:bg-[#2a2a2a] cursor-pointer">
      <div className="w-8 h-8 flex items-center justify-center mr-3">{icon}</div>
      <span className="flex-1">{name}</span>
      {isActive && (
        <div className="px-2 py-0.5 rounded-full bg-[#1a1a1a] text-xs text-green-500 border border-green-500/30">
          ON
        </div>
      )}
    </div>
  )
}

export function ProviderlList() {
  return (
    <div className="py-2">
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#5d5fef] flex items-center justify-center text-white text-xs">O</div>
        }
        name="OpenRouter"
        isActive={true}
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
        }
        name="OpenAI"
        isActive={true}
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">A</div>
        }
        name="Anthropic"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">1</div>
        }
        name="123"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#5d5fef] flex items-center justify-center text-white text-xs">
            娃
          </div>
        }
        name="娃娃流动"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">O3</div>
        }
        name="O3"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">A</div>
        }
        name="AiHubMix"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">O</div>
        }
        name="Ollama"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">A</div>
        }
        name="Azure OpenAI"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">G</div>
        }
        name="Gemini"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">P</div>
        }
        name="PPIO 派派云"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">
            A
          </div>
        }
        name="Alaya NeW"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs">七</div>
        }
        name="七牛云"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
            无
          </div>
        }
        name="无间芯客"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">深</div>
        }
        name="深度求索"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">O</div>
        }
        name="ocoolAI"
      />
      <ModelItem
        icon={
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs">G</div>
        }
        name="GitHub Models"
      />
    </div>
  )
}
