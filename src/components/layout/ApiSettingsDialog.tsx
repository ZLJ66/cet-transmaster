'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransStore, Provider } from '@/store/useTransStore'

const PROVIDERS: { value: Provider; label: string; defaultModel: string; baseUrl?: string }[] = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
  { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash' },
  { value: 'zhipu', label: '智谱 AI (Zhipu)', defaultModel: 'glm-4', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { value: 'minimax', label: 'Minimax', defaultModel: 'abab6.5s-chat' },
  { value: 'qwen', label: '阿里 Qwen (通义千问)', defaultModel: 'qwen-turbo', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet-20241022', baseUrl: 'https://api.anthropic.com' },
  { value: 'ollama', label: 'Ollama (本地模型)', defaultModel: 'llama3.2', baseUrl: 'http://localhost:11434' },
  { value: 'custom', label: '其它 (自定义)', defaultModel: '', baseUrl: '' },
]

export function ApiSettingsDialog() {
  const [showKey, setShowKey] = useState(false)
  const [open, setOpen] = useState(false)
  const { apiConfig, setApiConfig } = useTransStore()
  
  const [localConfig, setLocalConfig] = useState(apiConfig)

  useEffect(() => {
    setLocalConfig(apiConfig)
  }, [apiConfig])

  const handleProviderChange = (provider: Provider) => {
    const providerInfo = PROVIDERS.find(p => p.value === provider)
    setLocalConfig({
      provider,
      apiKey: '',
      model: providerInfo?.defaultModel || '',
      baseUrl: providerInfo?.baseUrl || '',
    })
  }

  const showBaseUrl = localConfig.provider === 'openai' || 
                      localConfig.provider === 'custom' || 
                      localConfig.provider === 'ollama' ||
                      localConfig.provider === 'anthropic'

  const handleSave = () => {
    setApiConfig(localConfig)
    setOpen(false)
  }

  const selectedProvider = PROVIDERS.find(p => p.value === localConfig.provider)

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Settings className="w-4 h-4 mr-2" />
        API 设置
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>API 设置</DialogTitle>
            <DialogDescription>
              配置 AI 服务提供商。所有信息仅保存在浏览器本地。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">服务商</Label>
              <Select 
                value={localConfig.provider} 
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服务商" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={localConfig.apiKey}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                  placeholder={selectedProvider?.baseUrl ? `在 ${selectedProvider.label} 获取` : '输入 API Key'}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? '隐藏' : '显示'}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                placeholder="输入模型名称"
              />
              <p className="text-xs text-slate-500">
                例如: {selectedProvider?.defaultModel}
              </p>
            </div>

            {showBaseUrl && (
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">
                  {localConfig.provider === 'custom' ? 'Base URL (必填)' : '自定义 Base URL (可选)'}
                </Label>
                <Input
                  id="baseUrl"
                  value={localConfig.baseUrl || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                  placeholder={
                    localConfig.provider === 'custom' 
                      ? '例如: https://api.example.com/v1' 
                      : localConfig.provider === 'ollama'
                        ? 'http://localhost:11434'
                        : '留空使用默认地址'
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSave}>
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
