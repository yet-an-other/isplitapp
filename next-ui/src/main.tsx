import React from 'react'
import ReactDOM from 'react-dom/client'
import {Layout} from './pages/Layout'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Home } from './pages/Home'
import { GroupList } from './pages/GroupList'
import { GroupEdit } from './pages/GroupEdit'


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home />},
      { path: '/', element: <Home /> },
      { path: '/groups', element: <GroupList /> },
      { path: '/groups/create', element: <GroupEdit /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

      <RouterProvider router={router} />

  </React.StrictMode>,
)
