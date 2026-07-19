/**
 * Reusable Global Toast Alert Engine
 * Injects non-intrusive alert prompts matching the pre-existing design system.
 */
class ToastEngine {
  constructor() {
    this._initContainer();
    
    // Add window listener to capture custom events from API client
    window.addEventListener('stadiumai-toast', (e) => {
      const { type, message } = e.detail;
      this.show(message, type);
    });
  }

  _initContainer() {
    this.container = document.getElementById('stadiumai-toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'stadiumai-toast-container';
      
      // Inline styles matching modern design variables
      Object.assign(this.container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: '9999',
        pointerEvents: 'none'
      });
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'success', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `stadiumai-toast-item ${type}`;
    
    // Icon mapping
    let icon = '';
    let color = 'var(--accent-green)';
    let bg = 'var(--bg-card)';
    
    if (type === 'error') {
      color = 'var(--accent-red)';
      icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (type === 'warn') {
      color = 'var(--accent-orange)';
      icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      icon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }

    // Set inline styles matching premium glassmorphism
    Object.assign(toast.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 18px',
      background: 'var(--bg-secondary)',
      border: `1px solid var(--border-color)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.85rem',
      fontWeight: '600',
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: 'auto',
      minWidth: '280px',
      maxWidth: '380px'
    });

    toast.innerHTML = `
      <span style="color: ${color}; display: flex; align-items: center;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    this.container.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Trigger animate-out & destroy
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
}

export const toast = new ToastEngine();
