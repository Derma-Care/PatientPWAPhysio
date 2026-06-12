/**
 * Lightweight toast utility for the Customer PWA.
 * Replaces SweetAlert2 with a custom CSS-animated toast that
 * matches the app's design system (navy / orange / surface).
 *
 * Usage:
 *   import { toast, confirmDialog } from '../utils/toast';
 *   toast.success('Saved!', 'Your profile has been updated.');
 *   toast.error('Failed', 'Something went wrong.');
 *   toast.info('Info', 'Just a heads-up.');
 *   const yes = await confirmDialog('Logout', 'Are you sure you want to log out?');
 */

/* ── Inject styles once ────────────────────────────────────────── */
const STYLE_ID = '__pwa_toast_style__';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #__pwa_toast_root__ {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 360px;
      width: calc(100vw - 36px);
    }

    .pwa-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
      background: #fff;
      border-left: 4px solid transparent;
      pointer-events: all;
      cursor: default;
      animation: pwa-toast-in 0.3s cubic-bezier(0.22,1,0.36,1) forwards;
      font-family: 'Outfit', 'Inter', sans-serif;
    }

    .pwa-toast.pwa-toast-out {
      animation: pwa-toast-out 0.25s ease-in forwards;
    }

    .pwa-toast-success { border-color: #10b981; }
    .pwa-toast-error   { border-color: #ef4444; }
    .pwa-toast-info    { border-color: #1B4F8A; }
    .pwa-toast-warning { border-color: #f59e0b; }

    .pwa-toast-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 16px;
    }

    .pwa-toast-success .pwa-toast-icon { background: #ecfdf5; color: #10b981; }
    .pwa-toast-error   .pwa-toast-icon { background: #fef2f2; color: #ef4444; }
    .pwa-toast-info    .pwa-toast-icon { background: #eff6ff; color: #1B4F8A; }
    .pwa-toast-warning .pwa-toast-icon { background: #fffbeb; color: #f59e0b; }

    .pwa-toast-body { flex: 1; min-width: 0; }
    .pwa-toast-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 2px;
      line-height: 1.3;
    }
    .pwa-toast-msg {
      font-size: 12px;
      color: #64748b;
      margin: 0;
      line-height: 1.45;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .pwa-toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 0;
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    }

    @keyframes pwa-toast-in {
      from { opacity: 0; transform: translateX(60px) scale(0.93); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    @keyframes pwa-toast-out {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(60px) scale(0.92); }
    }

    /* ── Confirm dialog ── */
    .pwa-confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: pwa-confirm-fade-in 0.2s ease forwards;
    }

    .pwa-confirm-box {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.22);
      padding: 28px 24px 20px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      animation: pwa-confirm-scale-in 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
      font-family: 'Outfit', 'Inter', sans-serif;
    }

    .pwa-confirm-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto 16px;
    }

    .pwa-confirm-title {
      font-size: 17px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .pwa-confirm-message {
      font-size: 13px;
      color: #64748b;
      margin: 0 0 22px;
      line-height: 1.55;
    }

    .pwa-confirm-btns {
      display: flex;
      gap: 10px;
    }

    .pwa-confirm-btn {
      flex: 1;
      padding: 11px 12px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Outfit', 'Inter', sans-serif;
      transition: opacity 0.15s;
    }
    .pwa-confirm-btn:hover { opacity: 0.87; }

    .pwa-confirm-btn-cancel {
      background: #f1f5f9;
      color: #64748b;
    }

    .pwa-confirm-btn-confirm {
      background: #1B4F8A;
      color: #fff;
    }

    .pwa-confirm-btn-confirm.danger {
      background: #ef4444;
    }

    @keyframes pwa-confirm-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes pwa-confirm-scale-in {
      from { opacity: 0; transform: scale(0.9) translateY(12px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

/* ── Toast root ─────────────────────────────────────────────────── */
function getRoot() {
  let root = document.getElementById('__pwa_toast_root__');
  if (!root) {
    root = document.createElement('div');
    root.id = '__pwa_toast_root__';
    document.body.appendChild(root);
  }
  return root;
}

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

/**
 * Show a toast notification.
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} title
 * @param {string} [message]
 * @param {number} [duration=3000]
 */
function showToast(type, title, message = '', duration = 3000) {
  const root = getRoot();
  const el = document.createElement('div');
  el.className = `pwa-toast pwa-toast-${type}`;
  el.innerHTML = `
    <div class="pwa-toast-icon">${ICONS[type] || 'ℹ'}</div>
    <div class="pwa-toast-body">
      <p class="pwa-toast-title">${title}</p>
      ${message ? `<p class="pwa-toast-msg">${message}</p>` : ''}
    </div>
    <button class="pwa-toast-close" aria-label="Close">×</button>
  `;

  const dismiss = () => {
    el.classList.add('pwa-toast-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  el.querySelector('.pwa-toast-close').addEventListener('click', dismiss);
  root.appendChild(el);

  if (duration > 0) setTimeout(dismiss, duration);
  return dismiss;
}

export const toast = {
  success: (title, message, duration) => showToast('success', title, message, duration),
  error:   (title, message, duration) => showToast('error',   title, message, duration ?? 4000),
  info:    (title, message, duration) => showToast('info',    title, message, duration),
  warning: (title, message, duration) => showToast('warning', title, message, duration),
};

/**
 * Show a confirmation dialog. Returns a Promise<boolean>.
 * @param {string} title
 * @param {string} message
 * @param {object} [opts]
 * @param {string} [opts.confirmText='Confirm']
 * @param {string} [opts.cancelText='Cancel']
 * @param {boolean} [opts.danger=false]  - Red confirm button
 */
export function confirmDialog(title, message, opts = {}) {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
  } = opts;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'pwa-confirm-overlay';
    overlay.innerHTML = `
      <div class="pwa-confirm-box">
        <div class="pwa-confirm-icon" style="background:${danger ? '#fef2f2' : '#eff6ff'}; color:${danger ? '#ef4444' : '#1B4F8A'}">
          ${danger ? '⚠' : '?'}
        </div>
        <p class="pwa-confirm-title">${title}</p>
        <p class="pwa-confirm-message">${message}</p>
        <div class="pwa-confirm-btns">
          <button class="pwa-confirm-btn pwa-confirm-btn-cancel" id="__pwa_cancel__">${cancelText}</button>
          <button class="pwa-confirm-btn pwa-confirm-btn-confirm ${danger ? 'danger' : ''}" id="__pwa_confirm__">${confirmText}</button>
        </div>
      </div>
    `;

    const close = (result) => {
      overlay.style.animation = 'pwa-confirm-fade-in 0.15s ease reverse forwards';
      setTimeout(() => { overlay.remove(); resolve(result); }, 150);
    };

    overlay.querySelector('#__pwa_cancel__').addEventListener('click', () => close(false));
    overlay.querySelector('#__pwa_confirm__').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    document.body.appendChild(overlay);
  });
}
