import React from 'react'
import ReactDOM from 'react-dom/client'
import {Layout} from './pages/Layout'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Home } from './pages/Home'
import { GroupList } from './pages/GroupList'
import { GroupEdit } from './pages/GroupEdit'
import { Group } from './pages/Group'
import { ExpenseList } from './pages/ExpenseList'
import { ExpenseEdit } from './pages/ExpenseEdit'


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home />},
      { path: '/', element: <Home /> },
      { path: '/groups', element: <GroupList /> },
      { path: '/groups/create', element: <GroupEdit /> },
      { path: '/groups/:groupId/edit', element: <GroupEdit /> },
      { path: '/groups/:groupId', element: <Group />, children: [
        { index: true, element: <ExpenseList /> },
        { path: 'expenses', element: <ExpenseList /> },
        { path: 'expenses/create', element: <ExpenseEdit /> },
      ]},
      { path: '/expenses/:expenseId/edit', element: <ExpenseEdit /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

      <RouterProvider router={router} />

  </React.StrictMode>,
)
