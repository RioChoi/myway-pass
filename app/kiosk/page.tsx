'use client';
import {useEffect} from 'react';
export default function Page(){useEffect(()=>{location.replace(new URLSearchParams(location.search).get('sector')==='cafe'?'/cafe':'/hospital');},[]);return <p>이동 중…</p>;}
