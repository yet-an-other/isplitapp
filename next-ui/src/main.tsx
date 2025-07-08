import './index.css'
import './i18n'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Layout } from './pages/Layout'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { About } from './pages/About'
import { GroupList } from './pages/GroupList'
import { GroupEdit } from './pages/GroupEdit'
import { Group } from './pages/Group'
import { ExpenseList } from './pages/ExpenseList'
import { ExpenseEdit } from './pages/ExpenseEdit'
import { Balance } from './pages/Balance'
import { RootBoundary } from './pages/RootErrorBoundary'
import { NotFound } from './pages/NotFound'
import { initOpenTelemetry } from './utils/openTelemetry'

// Initialize OpenTelemetry
initOpenTelemetry();


const router = createBrowserRouter([
  {
    element: <Layout />, errorElement: <RootBoundary />,
    children: [
      { index: true, element: <GroupList /> },
      { path: '/', element: <GroupList /> },
      { path: '/groups/*', element: <Navigate to={window.location.pathname.replace('/groups', '')} /> }, // fallback for old links
      { path: '/about', element: <About /> },
      { path: '/create', element: <GroupEdit />, id: 'create' },
      { path: ':groupId', element: <Group />, children: [
        { index: true, element: <ExpenseList />, handle: "expenses"},
        { path: 'edit', element: <GroupEdit />, handle: "edit" },
        { path: 'balance', element: <Balance />, handle: "balance" },
        { path: 'expenses', element: <ExpenseList />, handle: "expenses" },
        { path: 'expenses/create', element: <ExpenseEdit /> },
        { path: 'expenses/:expenseId/edit', element: <ExpenseEdit /> },
      ]},
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM
  .createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
