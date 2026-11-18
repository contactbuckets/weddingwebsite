import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

function enforceMinimumFontSize() {
  const clampTree = (root) => {
    if (!root || root.nodeType !== 1) return;
    const nodes = [root, ...root.querySelectorAll('*')];
    for (const node of nodes) {
      if (node.closest('svg')) continue;
      const size = Number.parseFloat(window.getComputedStyle(node).fontSize);
      if (Number.isFinite(size) && size < 14) {
        node.style.setProperty('font-size', '14px', 'important');
      }
    }
  };

  const clampAll = () => clampTree(document.documentElement);

  // Run after initial styles are available and again after web fonts finish loading.
  clampAll();
  if (document.fonts?.ready) document.fonts.ready.then(clampAll);

  // React-rendered content and class/style changes.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) clampTree(node);
          else if (record.target.nodeType === 1) clampTree(record.target);
        });
      } else if (record.target instanceof Element) {
        clampTree(record.target);
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Responsive media queries can change font sizes without mutating the DOM.
  window.addEventListener('resize', clampAll, { passive: true });
  window.addEventListener('orientationchange', clampAll, { passive: true });
  window.addEventListener('pageshow', clampAll);
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)