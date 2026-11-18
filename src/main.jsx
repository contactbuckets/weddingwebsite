import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

function enforceMinimumFontSize() {
  const clamp = (root) => {
    if (root.nodeType !== 1) return;
    const nodes = [root, ...root.querySelectorAll('*')];
    for (const node of nodes) {
      if (node.closest('svg')) continue;
      const size = Number.parseFloat(window.getComputedStyle(node).fontSize);
      if (Number.isFinite(size) && size < 14) {
        node.style.setProperty('font-size', '14px', 'important');
      }
    }
  };
  clamp(document.documentElement);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(clamp);
      else if (record.target instanceof Element) clamp(record.target);
    }
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style']});
}
enforceMinimumFontSize();

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)