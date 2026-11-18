import React from 'react';
import './src/app/globals.css';
import WeddingPage from './src/app/page';
import { configureWeddingData } from './src/data/runtime';
export default function MuslimOriginalTemplate({data={}}) {
 configureWeddingData(data);
 return <div className="muslim-original-template"><WeddingPage/></div>;
}