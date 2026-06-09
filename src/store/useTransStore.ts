import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'default' | 'openai' | 'deepseek' | 'gemini' | 'zhipu' | 'minimax' | 'qwen' | 'anthropic' | 'xiaomi' | 'ollama' | 'custom'

export interface ApiConfig {
  provider: Provider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface Draft {
  sentences: string[]
  userTranslations: string[]
  referenceTranslations: string[]
  currentIndex: number
  timer: number
  currentTitle: string
  status: Status
}

export interface HistoryItem {
  id: string
  date: string
  title: string
  totalTime: number
  score: number
  sentences: string[]
  userTranslations: string[]
  referenceTranslations?: string[]
  analysis?: AnalysisResult[]
}

export interface AnalysisResult {
  score: number
  errors: Array<{
    original: string
    suggestion: string
    reason: string
  }>
  polish: string[]
}

export type Status = 'idle' | 'setup' | 'training' | 'paused' | 'analyzing' | 'completed'

interface TransState {
  // 练习状态
  status: Status
  sentences: string[]
  referenceTranslations: string[]
  userTranslations: string[]
  currentIndex: number
  
  // 计时器
  timer: number
  
  // API 配置
  apiConfig: ApiConfig
  
  // 历史记录
  history: HistoryItem[]
  
  // 草稿（用于恢复练习）
  draft: Draft | null
  
  // 设置
  currentTitle: string
  layout: 'horizontal' | 'vertical'
  
  // Actions
  setStatus: (status: Status) => void
  setSentences: (sentences: string[]) => void
  setReferenceTranslations: (translations: string[]) => void
  updateUserTranslation: (index: number, translation: string) => void
  nextSentence: () => void
  prevSentence: () => void
  goToSentence: (index: number) => void
  setCurrentIndex: (index: number) => void
  
  // 计时器
  setTimer: (time: number) => void
  incrementTimer: () => void
  
  // API 配置
  setApiConfig: (config: Partial<ApiConfig>) => void
  
  // 历史记录
  addHistory: (item: Omit<HistoryItem, 'id'>) => void
  deleteHistory: (id: string) => void
  clearHistory: () => void
  
  // 草稿
  saveDraft: () => void
  loadDraft: () => Draft | null
  loadDraftToState: () => void
  clearDraft: () => void
  
  // 练习控制
  startPractice: () => void
  pausePractice: () => void
  resumePractice: () => void
  endPractice: () => void
  reset: () => void

  // 标题
  setCurrentTitle: (title: string) => void

  // 布局
  setLayout: (layout: 'horizontal' | 'vertical') => void

  // 句子操作
  mergeSentences: (index: number) => void
  splitSentence: (index: number) => void
  editSentence: (index: number, newSentence: string) => void
}

const DEFAULT_API_KEY = 'sk-6380e65353684772afd91470517b3130'

const initialApiConfig: ApiConfig = {
  provider: 'default',
  apiKey: DEFAULT_API_KEY,
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com',
}

export const useTransStore = create<TransState>()(
  persist(
    (set, get) => ({
      // 初始状态
      status: 'idle',
      sentences: [],
      referenceTranslations: [],
      userTranslations: [],
      currentIndex: 0,
      timer: 0,
      apiConfig: initialApiConfig,
      history: [],
      draft: null,
      currentTitle: '',
      layout: 'horizontal',

      // Actions
      setStatus: (status) => set({ status }),
      
      setSentences: (sentences) => set({ 
        sentences, 
        userTranslations: new Array(sentences.length).fill(''),
        currentIndex: 0 
      }),
      
      setReferenceTranslations: (translations) => set({ referenceTranslations: translations }),
      
      updateUserTranslation: (index, translation) => set((state) => {
        const newTranslations = [...state.userTranslations]
        newTranslations[index] = translation
        return { userTranslations: newTranslations }
      }),
      
      nextSentence: () => set((state) => ({
        currentIndex: Math.min(state.currentIndex + 1, state.sentences.length - 1)
      })),
      
      prevSentence: () => set((state) => ({
        currentIndex: Math.max(state.currentIndex - 1, 0)
      })),
      
      goToSentence: (index) => set((state) => ({
        currentIndex: Math.max(0, Math.min(index, state.sentences.length - 1))
      })),
      
      setCurrentIndex: (index) => set({ currentIndex: index }),
      
      setTimer: (time) => set({ timer: time }),
      
      incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
      
      setApiConfig: (config) => set((state) => ({
        apiConfig: { ...state.apiConfig, ...config }
      })),
      
      addHistory: (item) => set((state) => ({
        history: [{
          ...item,
          id: Date.now().toString(),
        }, ...state.history]
      })),
      
      deleteHistory: (id: string) => set((state) => ({
        history: state.history.filter(item => item.id !== id)
      })),
      
      clearHistory: () => set({ history: [] }),
      
      saveDraft: () => set((state) => {
        if (state.status === 'idle' || state.status === 'completed') return state
        return {
          draft: {
            sentences: state.sentences,
            userTranslations: state.userTranslations,
            referenceTranslations: state.referenceTranslations,
            currentIndex: state.currentIndex,
            timer: state.timer,
            currentTitle: state.currentTitle,
            status: state.status,
          }
        }
      }),
      
      loadDraft: () => {
        const state = get()
        return state.draft
      },
      
      loadDraftToState: () => {
        const state = get()
        if (state.draft) {
          set({
            sentences: state.draft.sentences,
            userTranslations: state.draft.userTranslations,
            referenceTranslations: state.draft.referenceTranslations,
            currentIndex: state.draft.currentIndex,
            timer: state.draft.timer,
            currentTitle: state.draft.currentTitle,
            status: state.draft.status,
          })
        }
      },
      
      clearDraft: () => set({ draft: null }),
      
      startPractice: () => set({ 
        status: 'training', 
        currentIndex: 0,
        timer: 0 
      }),
      
      pausePractice: () => set({ status: 'paused' }),
      
      resumePractice: () => set({ status: 'training' }),
      
      endPractice: () => set({ status: 'completed' }),
      
      reset: () => set({
        status: 'idle',
        sentences: [],
        referenceTranslations: [],
        userTranslations: [],
        currentIndex: 0,
        timer: 0,
        currentTitle: '',
        draft: null,
      }),
      
      setCurrentTitle: (title) => set({ currentTitle: title }),

      setLayout: (layout) => set({ layout }),

      mergeSentences: (index) => set((state) => {
        if (index >= state.sentences.length - 1) return state
        const newSentences = [...state.sentences]
        newSentences[index] = newSentences[index] + newSentences[index + 1]
        newSentences.splice(index + 1, 1)
        const newTranslations = [...state.userTranslations]
        newTranslations[index] = newTranslations[index] + newTranslations[index + 1]
        newTranslations.splice(index + 1, 1)
        return {
          sentences: newSentences,
          userTranslations: newTranslations,
          currentIndex: Math.min(state.currentIndex, newSentences.length - 1)
        }
      }),

      splitSentence: (index) => set((state) => {
        const sentence = state.sentences[index]
        const parts = sentence.split(/([。？！])/)
        const newSentences: string[] = []
        const newTranslations: string[] = []
        let currentSentence = ''
        let currentTranslation = state.userTranslations[index] || ''

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          if (part === '。' || part === '！' || part === '？') {
            currentSentence += part
            if (currentSentence.trim()) {
              newSentences.push(currentSentence.trim())
              newTranslations.push(i === parts.length - 1 ? currentTranslation : '')
            }
            currentSentence = ''
          } else {
            currentSentence += part
          }
        }
        if (currentSentence.trim()) {
          newSentences.push(currentSentence.trim())
          newTranslations.push('')
        }

        if (newSentences.length <= 1) return state

        const newAllSentences = [...state.sentences]
        newAllSentences.splice(index, 1, ...newSentences)
        const newAllTranslations = [...state.userTranslations]
        newAllTranslations.splice(index, 1, ...newTranslations)

        return {
          sentences: newAllSentences,
          userTranslations: newAllTranslations,
          currentIndex: Math.min(state.currentIndex, newAllSentences.length - 1)
        }
      }),

      editSentence: (index, newSentence) => set((state) => {
        const newSentences = [...state.sentences]
        newSentences[index] = newSentence
        return { sentences: newSentences }
      }),
    }),
    {
      name: 'cet-transmaster-storage',
      partialize: (state) => ({
        apiConfig: state.apiConfig,
        history: state.history,
        draft: state.draft,
        layout: state.layout,
      }),
    }
  )
)
