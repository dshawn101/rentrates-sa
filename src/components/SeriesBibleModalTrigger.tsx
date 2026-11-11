'use client';

import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSeriesBibleModalTrigger } from '../hooks/useSeriesBibleModalTrigger';

const SeriesBibleModal = lazy(() => import('./SeriesBibleModal'));

function ArmedTrigger({pathname}: {pathname: string}) {
  const {open, close} = useSeriesBibleModalTrigger({pathname, loggedIn: false, loading: false});
  return open ? <Suspense fallback={null}><SeriesBibleModal close={close}/></Suspense> : null;
}

export function SeriesBibleModalTrigger() {
  const {user, loading} = useAuth();
  const {pathname} = useLocation();
  return !user && !loading && pathname === '/' ? <ArmedTrigger pathname={pathname}/> : null;
}
