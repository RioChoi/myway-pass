import React from 'react';
import {createRoot} from 'react-dom/client';
import ProfileApp from '../components/ProfileApp';
import '../app/globals.css';
import '../app/terminal.css';
createRoot(document.getElementById('root')!).render(<ProfileApp/>);
