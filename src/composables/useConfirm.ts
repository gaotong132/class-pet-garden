import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
  onConfirm: () => void
}

export function useConfirm() {
  const confirmDialog = ref({
    show: false,
    title: '确认',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    type: 'info' as 'info' | 'warning' | 'danger',
    onConfirm: () => {}
  })

  function showConfirm(options: ConfirmOptions) {
    confirmDialog.value = {
      show: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || '确认',
      cancelText: options.cancelText || '取消',
      type: options.type || 'info',
      onConfirm: () => {
        options.onConfirm()
        confirmDialog.value.show = false
      }
    }
  }

  function closeConfirm() {
    confirmDialog.value.show = false
  }

  return {
    confirmDialog,
    showConfirm,
    closeConfirm
  }
}
